/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D1B2A",
        card: "#1B263B",
        primary: "#00C853",
        secondary: "#00E676",
      },
    },
  },
  plugins: [],
}
