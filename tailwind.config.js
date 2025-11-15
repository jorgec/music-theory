/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{svelte,js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        'music-dark': '#1a1a2e',
        'music-accent': '#16213e',
        'music-highlight': '#0f3460',
        'music-bright': '#e94560',
      }
    },
  },
  plugins: [],
}
