/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#004A98",
          blueDark: "#003366",
          orange: "#EF761F",
          green: "#437264",
          yellow: "#FFE009",
          black: "#171717",
          gray: "#323539",
          light: "#F9F9F9",
        },
      },
    },
  },
  plugins: [],
};
