/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        clickup: {
          purple: '#7B68EE',
          pink: '#FF007F',
          blue: '#1E75FF',
          green: '#00C875',
          yellow: '#FFCC00',
          orange: '#FF7F00',
          red: '#F83232',
          dark: {
            bg: '#18191B',
            surface: '#202225',
            border: '#2F3136',
            card: '#292B2F'
          }
        }
      }
    },
  },
  plugins: [],
}
