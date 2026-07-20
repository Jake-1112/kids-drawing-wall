// Theme definitions (shared by the theme picker, big screen, and drawing screen)
// gradientStops/gradientType let the big screen re-draw the same background onto a
// <canvas> when saving a photo, since canvas can't take a CSS gradient string directly.
const THEMES = {
  ocean: {
    label: 'Ocean',
    emoji: '🌊',
    accent: '#0288d1',
    bgGradient: 'linear-gradient(180deg, #bfe9ff 0%, #4fb7e8 45%, #0a5fa0 100%)',
    gradientStops: [[0, '#bfe9ff'], [0.45, '#4fb7e8'], [1, '#0a5fa0']]
  },
  sky: {
    label: 'Sky',
    emoji: '☁️',
    accent: '#42a5f5',
    bgGradient: 'linear-gradient(180deg, #e8f6ff 0%, #a9d8ff 55%, #6fb3f2 100%)',
    gradientStops: [[0, '#e8f6ff'], [0.55, '#a9d8ff'], [1, '#6fb3f2']]
  },
  forest: {
    label: 'Forest',
    emoji: '🌲',
    accent: '#2e7d32',
    bgGradient: 'linear-gradient(180deg, #cdebc4 0%, #7fbf6e 50%, #2f6b34 100%)',
    gradientStops: [[0, '#cdebc4'], [0.5, '#7fbf6e'], [1, '#2f6b34']]
  },
  space: {
    label: 'Space',
    emoji: '🌌',
    accent: '#7c4dff',
    bgGradient: 'radial-gradient(ellipse at top, #2a2160 0%, #0a0a24 70%)',
    gradientType: 'radial',
    gradientStops: [[0, '#2a2160'], [0.7, '#0a0a24'], [1, '#0a0a24']]
  },
  party: {
    label: 'Party',
    emoji: '🎉',
    accent: '#e91e63',
    bgGradient: 'linear-gradient(180deg, #ffd6e8 0%, #ff8fb1 45%, #c2185b 100%)',
    gradientStops: [[0, '#ffd6e8'], [0.45, '#ff8fb1'], [1, '#c2185b']]
  },
  jungle: {
    label: 'Jungle',
    emoji: '🦕',
    accent: '#558b2f',
    bgGradient: 'linear-gradient(180deg, #e3f8c8 0%, #8bc34a 50%, #33691e 100%)',
    gradientStops: [[0, '#e3f8c8'], [0.5, '#8bc34a'], [1, '#33691e']]
  },
  winter: {
    label: 'Winter',
    emoji: '❄️',
    accent: '#0288d1',
    bgGradient: 'linear-gradient(180deg, #eaf6ff 0%, #90caf9 55%, #1565c0 100%)',
    gradientStops: [[0, '#eaf6ff'], [0.55, '#90caf9'], [1, '#1565c0']]
  },
  custom: {
    label: 'Custom Photo',
    emoji: '🖼️',
    accent: '#616161',
    bgGradient: 'linear-gradient(160deg, #e0e0e0 0%, #9e9e9e 100%)',
    gradientStops: [[0, '#e0e0e0'], [1, '#9e9e9e']]
  }
};

if (typeof module !== 'undefined') module.exports = THEMES;
