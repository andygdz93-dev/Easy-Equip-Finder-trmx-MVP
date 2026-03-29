/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#0f172a",
        "panel-light": "#111827",
        accent: "#38bdf8",
      },
    },
  },
  plugins: [],
};