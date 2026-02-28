/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0d1117",
          card: "#161b22",
          hover: "#1c2333",
          border: "#2a2f3a",
        },
        accent: {
          DEFAULT: "#10b981",
          dim: "#059669",
        },
      },
    },
  },
  plugins: [],
};
