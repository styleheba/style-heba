import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF5F5',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#E84C6A',   // Primary rose
          600: '#D63A57',
          700: '#BE2D4A',
          800: '#9A2240',
          900: '#7D1D3B',
        },
        warm: {
          50: '#FFFBF7',
          100: '#FFF3E8',
          200: '#FFE4CC',
          300: '#FFD0A8',
          400: '#FFB97D',
          500: '#F5A55A',
        },
        slate: {
          950: '#0C0F1A',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Helvetica Neue',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'sans-serif',
        ],
        display: [
          'Noto Serif KR',
          'Georgia',
          'serif',
        ],
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'count-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.6s ease-out',
        'count-up': 'count-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
