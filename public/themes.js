// Theme definitions (shared by the theme picker, big screen, and drawing screen)
const THEMES = {
  ocean: {
    label: 'Ocean',
    emoji: '🌊',
    accent: '#0288d1',
    bgGradient: 'linear-gradient(180deg, #bfe9ff 0%, #4fb7e8 45%, #0a5fa0 100%)'
  },
  sky: {
    label: 'Sky',
    emoji: '☁️',
    accent: '#42a5f5',
    bgGradient: 'linear-gradient(180deg, #e8f6ff 0%, #a9d8ff 55%, #6fb3f2 100%)'
  },
  forest: {
    label: 'Forest',
    emoji: '🌲',
    accent: '#2e7d32',
    bgGradient: 'linear-gradient(180deg, #cdebc4 0%, #7fbf6e 50%, #2f6b34 100%)'
  },
  space: {
    label: 'Space',
    emoji: '🌌',
    accent: '#7c4dff',
    bgGradient: 'radial-gradient(ellipse at top, #2a2160 0%, #0a0a24 70%)'
  },
  party: {
    label: 'Party',
    emoji: '🎉',
    accent: '#e91e63',
    bgGradient: 'linear-gradient(180deg, #ffd6e8 0%, #ff8fb1 45%, #c2185b 100%)'
  },
  jungle: {
    label: 'Jungle',
    emoji: '🦕',
    accent: '#558b2f',
    bgGradient: 'linear-gradient(180deg, #e3f8c8 0%, #8bc34a 50%, #33691e 100%)'
  },
  winter: {
    label: 'Winter',
    emoji: '❄️',
    accent: '#0288d1',
    bgGradient: 'linear-gradient(180deg, #eaf6ff 0%, #90caf9 55%, #1565c0 100%)'
  }
};

if (typeof module !== 'undefined') module.exports = THEMES;
