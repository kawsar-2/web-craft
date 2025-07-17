/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      aspectRatio: {
        '16/9': '16 / 9',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.aspect-w-16': {
          aspectRatio: '16/9',
        },
        '.aspect-h-9': {
          aspectRatio: '16/9',
        },
      });
    },
  ],
};