module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // adjust to your file structure
  ],
  darkMode: 'class', // or 'media'
  plugins: [require('daisyui')],
}
