/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gravity Series Brand Colors
        primary: {
          // GES Orange #EF761F as primary
          50: '#fef5ee',
          100: '#fde8d7',
          200: '#fbcdae',
          300: '#f8ab7a',
          400: '#f58044',
          500: '#EF761F', // Main orange
          600: '#e05d0d',
          700: '#ba460d',
          800: '#943912',
          900: '#783112',
        },
        accent: {
          // Accent Green #61CE70
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#61CE70', // Main green
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        gsblue: {
          // GS Blue #004a98
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#004a98', // Main blue
          700: '#003a7a',
          800: '#002f62',
          900: '#00254a',
        },
        gsgreen: {
          // GS Green #437264
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#437264', // Main green
          600: '#35584f',
          700: '#2a4640',
          800: '#1f3430',
          900: '#162520',
        },
        ggsgreen: {
          // GGS Grön #8A9A5B
          50: '#f7f8f3',
          100: '#edeee3',
          200: '#d9ddc6',
          300: '#bec89f',
          400: '#a3b376',
          500: '#8A9A5B', // Main olive green
          600: '#6f7e48',
          700: '#58633a',
          800: '#474f30',
          900: '#3a4129',
        },
        enduro: {
          // Enduro Yellow #FFE009
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#FFE009', // Main yellow
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        dark: {
          // Using Gravity Series dark colors
          50: '#f9f9f9', // Star Fade
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#323539', // Secondary
          800: '#262626',
          900: '#171717', // Primary dark
        }
      },
    },
  },
  plugins: [],
}
