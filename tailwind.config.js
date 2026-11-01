/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/views/**/*.ejs', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#ecfdf3', 100: '#d1fae1', 500: '#00a14b', 600: '#00853f', 700: '#006b33', 900: '#053d20' },
        sun: { 400: '#fde047', 500: '#f5c400' },
        flag: { red: '#e31b23' },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Ubuntu', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
