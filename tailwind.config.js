/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gs-primary': {
          DEFAULT: '#004a98',
          dark: '#003366',
          light: 'rgba(0, 74, 152, 0.1)',
        },
        'gs-accent': {
          DEFAULT: '#EF761F',
          light: 'rgba(239, 118, 31, 0.1)',
        },
        'gs-success': {
          DEFAULT: '#437264',
          light: 'rgba(67, 114, 100, 0.1)',
        },
        'gs-warning': {
          DEFAULT: '#FFE009',
          light: 'rgba(255, 224, 9, 0.1)',
        },
        'gs-dark': '#171717',
        'gs-gray': '#323539',
        'gs-light': '#F9F9F9',
        'gs-border': '#E5E7EB',
        'gs-border-dark': '#323539',
      },
      spacing: {
        'gs-xs': '0.25rem',
        'gs-sm': '0.5rem',
        'gs-md': '1rem',
        'gs-lg': '1.5rem',
        'gs-xl': '2rem',
        'gs-2xl': '3rem',
        'gs-3xl': '4rem',
      },
      borderRadius: {
        'gs-sm': '0.375rem',
        'gs-md': '0.5rem',
        'gs-lg': '0.75rem',
        'gs-xl': '1rem',
        'gs-2xl': '1.5rem',
      },
      boxShadow: {
        'gs-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'gs-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'gs-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'gs-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'gs-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      transitionDuration: {
        'gs-fast': '150ms',
        'gs-base': '300ms',
        'gs-slow': '500ms',
      },
    },
  },
  plugins: [],
}
