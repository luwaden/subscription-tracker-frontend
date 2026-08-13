/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e6f7f9",
          100: "#ccf0f3",
          400: "#0fb8c9",
          500: "#0097b2",
          600: "#00788e",
          700: "#005a6a",
        },
      },
    },
  },
  plugins: [],
};
