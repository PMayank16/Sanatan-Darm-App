/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#800000", // Maroon
        secondary: "#FFFFFF", // White
        accent: "#808080", // Gray
        lightGray: "#F5F5F5",
        deepMaroon: "#4A0000",
      },
    },
  },
  plugins: [],
};
