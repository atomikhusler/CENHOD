/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}', './index.html'],
  theme: {
    extend: {
      colors: {
        emeraldPro: '#10B981',
        rubyError: '#F43F5E'
      }
    },
  },
  plugins: [],
}