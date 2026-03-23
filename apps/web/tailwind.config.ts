import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        slippi: {
          green: '#21BA45',
          dark: '#0a0a0a',
          darker: '#050505',
          card: '#141414',
          border: '#2a2a2a',
        },
        rank: {
          bronze: '#CD7F32',
          silver: '#C0C0C0',
          gold: '#FFD700',
          platinum: '#00CED1',
          diamond: '#4169E1',
          master: '#8B008B',
        },
      },
      fontFamily: {
        display: ['Chakra Petch', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
