/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        crimson: {
          50:  '#fff1f2',
          100: '#ffe0e2',
          200: '#ffc7ca',
          300: '#ffa0a5',
          400: '#ff6870',
          500: '#f83a43',
          600: '#e51d27',
          700: '#c0283c',
          800: '#9f1c2c',
          900: '#841b29',
          950: '#490910',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body:    ['system-ui', '-apple-system', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-lg': '0 4px 6px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.1)',
        'red':     '0 4px 20px rgba(192,40,60,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease both',
        'slide-up': 'slideUp 0.4s ease both',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
    },
  },
  plugins: [],
};
