/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fca: {
          orange: '#F98005',
          orangeLight: '#FDB913',
          yellow: '#FFC107',
          orangeShadow: '#F39200',
          dark: '#373737',
          charcoal: '#555555',
          gray: '#A6A6A6',
          white: '#FFFFFF',
        }
      }
    },
  },
  plugins: [],
}
