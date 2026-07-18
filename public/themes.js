// 테마 정의 (테마 선택 화면 / 메인 화면 / 그리기 화면에서 공통으로 사용)
const THEMES = {
  ocean: {
    label: '바다',
    emoji: '🌊',
    accent: '#0288d1',
    bgGradient: 'linear-gradient(180deg, #bfe9ff 0%, #4fb7e8 45%, #0a5fa0 100%)'
  },
  sky: {
    label: '하늘',
    emoji: '☁️',
    accent: '#42a5f5',
    bgGradient: 'linear-gradient(180deg, #e8f6ff 0%, #a9d8ff 55%, #6fb3f2 100%)'
  },
  forest: {
    label: '숲속',
    emoji: '🌲',
    accent: '#2e7d32',
    bgGradient: 'linear-gradient(180deg, #cdebc4 0%, #7fbf6e 50%, #2f6b34 100%)'
  },
  space: {
    label: '우주',
    emoji: '🌌',
    accent: '#7c4dff',
    bgGradient: 'radial-gradient(ellipse at top, #2a2160 0%, #0a0a24 70%)'
  }
};

if (typeof module !== 'undefined') module.exports = THEMES;
