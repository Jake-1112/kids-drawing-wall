const path = require('path');
const os = require('os');
const crypto = require('crypto');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');

let qrcodeTerminal;
try {
  qrcodeTerminal = require('qrcode-terminal');
} catch (e) {
  qrcodeTerminal = null;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 5 * 1024 * 1024 // 그림(이미지) 데이터가 커질 수 있어서 여유 있게 설정
});

// Render 등 프록시 뒤에서 실행될 때 req.ip가 실제 클라이언트 IP를 가리키도록 함
app.set('trust proxy', true);

const PORT = process.env.PORT || 3000;
// 나중에 실제 웹사이트(호스팅)로 옮길 때는 BASE_URL 환경변수만 지정하면 됩니다.
// 예: BASE_URL=https://mydrawingwall.com
const BASE_URL_ENV = process.env.BASE_URL || null;

const ALLOWED_THEMES = ['ocean', 'sky', 'forest', 'space', 'party', 'jungle', 'winter', 'custom'];
const SESSION_TTL_MS = (Number(process.env.SESSION_TTL_HOURS) || 12) * 60 * 60 * 1000; // 기본 12시간 지나면 자동 정리
const MAX_DRAWING_BASE64_LENGTH = 4 * 1024 * 1024; // 그림 base64 문자열 최대 길이(대략 4MB)
const MAX_CUSTOM_BG_BASE64_LENGTH = 4 * 1024 * 1024; // 호스트 배경사진 base64 최대 길이(대략 4MB)

// 메모리에만 저장 (서버 재시작하거나 세션을 끝내면 사라짐 — 그림도 디스크에 저장하지 않고 실시간 중계만 함)
const sessions = new Map(); // sessionId -> { theme, title, createdAt }

// ---- 아주 단순한 in-memory rate limiter (외부 의존성 없이) ----
function createRateLimiter({ windowMs, max }) {
  const hits = new Map(); // key -> timestamp 배열
  return function isAllowed(key) {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t <= windowMs);
    if (arr.length >= max) {
      hits.set(key, arr);
      return false;
    }
    arr.push(now);
    hits.set(key, arr);
    return true;
  };
}

const sessionCreateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 20 }); // IP당 분당 20회
const drawingLimiter = createRateLimiter({ windowMs: 1000, max: 3 }); // 소켓당 초당 3장

function genId() {
  return crypto.randomBytes(4).toString('hex'); // 8자리
}

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}

const LOCAL_IP = getLocalIP();

function getBaseUrl() {
  if (BASE_URL_ENV) return BASE_URL_ENV.replace(/\/$/, '');
  const host = LOCAL_IP || 'localhost';
  return `http://${host}:${PORT}`;
}

async function buildSessionPayload(id, sessionData) {
  const drawUrl = `${getBaseUrl()}/draw/${id}`;
  const qrDataUrl = await QRCode.toDataURL(drawUrl, { margin: 1, width: 320 });
  return {
    id,
    theme: sessionData.theme,
    title: sessionData.title || '',
    paused: !!sessionData.paused,
    customBackground: sessionData.customBackground || null,
    drawUrl,
    qrDataUrl
  };
}

app.use(express.json({ limit: '6mb' })); // 호스트 배경사진 업로드(base64)를 담기 위해 여유 있게 설정
app.use(express.static(path.join(__dirname, 'public')));

// ---- 페이지 라우트 ----
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/display/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});
app.get('/draw/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'draw.html'));
});

// ---- API ----
app.post('/api/session', async (req, res) => {
  if (!sessionCreateLimiter(req.ip)) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  const { theme, title, customBackground } = req.body || {};
  if (!ALLOWED_THEMES.includes(theme)) {
    return res.status(400).json({ error: 'invalid_theme' });
  }
  let bg = null;
  if (theme === 'custom') {
    if (typeof customBackground !== 'string' || !customBackground.startsWith('data:image/')) {
      return res.status(400).json({ error: 'missing_custom_background' });
    }
    if (customBackground.length > MAX_CUSTOM_BG_BASE64_LENGTH) {
      return res.status(400).json({ error: 'custom_background_too_large' });
    }
    bg = customBackground;
  }
  const id = genId();
  const sessionData = {
    theme,
    title: typeof title === 'string' ? title.slice(0, 40) : '',
    customBackground: bg,
    createdAt: Date.now(),
    paused: false
  };
  sessions.set(id, sessionData);
  try {
    const payload = await buildSessionPayload(id, sessionData);
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: 'qr_generation_failed' });
  }
});

app.get('/api/session/:id', async (req, res) => {
  const sessionData = sessions.get(req.params.id);
  if (!sessionData) return res.status(404).json({ error: 'not_found' });
  try {
    const payload = await buildSessionPayload(req.params.id, sessionData);
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: 'qr_generation_failed' });
  }
});

app.post('/api/session/:id/end', (req, res) => {
  sessions.delete(req.params.id);
  io.to(req.params.id).emit('sessionEnded');
  res.json({ ok: true });
});

// 오래된 세션 자동 정리
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of sessions.entries()) {
    if (now - data.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}, 30 * 60 * 1000);

// ---- Socket.io: 세션(room) 단위로 그림 중계 ----
io.on('connection', (socket) => {
  socket.on('joinSession', ({ sessionId, role }) => {
    if (!sessionId || !sessions.has(sessionId)) {
      socket.emit('sessionEnded');
      return;
    }
    socket.join(sessionId);
    socket.data.sessionId = sessionId;
    socket.data.role = role;
  });

  socket.on('newDrawing', (data) => {
    const sessionId = socket.data.sessionId;
    const sessionData = sessionId && sessions.get(sessionId);
    if (!sessionData || !data) return;
    const hasImage = typeof data.image === 'string' && data.image.length > 0;
    const message = typeof data.message === 'string' ? data.message.trim().slice(0, 80) : '';
    if (!hasImage && !message) return; // 그림도 텍스트도 없으면 무시
    if (sessionData.paused) {
      socket.emit('drawingRejected', { reason: 'paused' });
      return;
    }
    if (!drawingLimiter(socket.id)) {
      socket.emit('drawingRejected', { reason: 'rate_limited' });
      return;
    }
    if (hasImage && data.image.length > MAX_DRAWING_BASE64_LENGTH) {
      socket.emit('drawingRejected', { reason: 'too_large' });
      return;
    }
    io.to(sessionId).emit('newDrawing', {
      id: genId(),
      createdAt: Date.now(),
      image: hasImage ? data.image : null,
      message,
      name: typeof data.name === 'string' ? data.name.slice(0, 20) : ''
    });
  });

  // 관리자(큰 화면) 전용: 특정 그림 삭제/반짝임 강조 — role이 'display'인 소켓만 허용
  socket.on('adminDeleteDrawing', ({ drawingId } = {}) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId || socket.data.role !== 'display') return;
    if (typeof drawingId !== 'string') return;
    io.to(sessionId).emit('drawingDeleted', { id: drawingId });
  });

  socket.on('adminHighlightDrawing', ({ drawingId } = {}) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId || socket.data.role !== 'display') return;
    if (typeof drawingId !== 'string') return;
    io.to(sessionId).emit('drawingHighlighted', { id: drawingId });
  });

  // 관리자 전용: 새 그림 수신 일시정지/재개 (화면에 이미 떠 있는 그림은 그대로 유지)
  socket.on('adminSetPaused', ({ paused } = {}) => {
    const sessionId = socket.data.sessionId;
    const sessionData = sessionId && sessions.get(sessionId);
    if (!sessionData || socket.data.role !== 'display') return;
    sessionData.paused = !!paused;
    io.to(sessionId).emit('pausedStateChanged', { paused: sessionData.paused });
  });
});

server.listen(PORT, () => {
  const base = getBaseUrl();
  console.log('==============================================');
  console.log(' 그림 놀이터 서버가 실행되었습니다!');
  console.log('');
  console.log(` 메인 컴퓨터(큰 화면)에서 열기: ${base}/`);
  console.log(' 테마를 고르고 "그림 추가하기"를 누르면');
  console.log(' 화면에 QR코드가 뜹니다. 태블릿으로 스캔해서 그림을 그려보세요.');
  if (!BASE_URL_ENV && LOCAL_IP && qrcodeTerminal) {
    console.log('');
    console.log(' (참고용) 메인 화면 QR코드:');
    qrcodeTerminal.generate(`${base}/`, { small: true });
  }
  if (!LOCAL_IP && !BASE_URL_ENV) {
    console.log('');
    console.log(' ⚠ 네트워크 IP를 찾지 못했습니다. 와이파이 연결을 확인하세요.');
  }
  if (BASE_URL_ENV && BASE_URL_ENV.startsWith('http://')) {
    console.log('');
    console.log(' ⚠ BASE_URL이 http://로 설정되어 있습니다. 공개 배포 환경이라면');
    console.log('   https:// 주소를 사용하는 것을 권장합니다 (Render는 기본 제공).');
  }
  console.log('==============================================');
});
