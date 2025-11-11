/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // GravitySeries colors (keeping your existing design)
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // GravitySeries radius
        'gs-sm': '0.375rem',
        'gs-md': '0.5rem',
        'gs-lg': '0.75rem',
        'gs-xl': '1rem',
        'gs-2xl': '1.5rem',
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
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
