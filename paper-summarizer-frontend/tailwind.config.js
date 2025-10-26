/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        primary: '#4a90e2',
        accent: '#7c4dff',
        bg: '#0b1020',
        card: '#0f1724',
        glass: 'rgba(255,255,255,0.06)',
        white: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderOpacity: {
        6: '0.06',
      },
      backgroundOpacity: {
        6: '0.06',
      },
    },
  },
  plugins: [],
};