# Kvalpoäng Kalkylator

Modern poängkalkylator för cykelserier med GravitySeries design system.

## 🚀 Snabbstart

```bash
# Installera dependencies
npm install

# Starta development server
npm run dev

# Bygga för produktion
npm run build
```

## 📁 Projektstruktur

```
├── src/
│   ├── App.jsx           # Huvudkomponent med all funktionalitet
│   ├── main.jsx          # Entry point
│   ├── index.css         # Tailwind base styles
│   └── gravity-series.css # GravitySeries design system
├── public/               # Statiska filer
├── .github/workflows/    # GitHub Actions för auto-deploy
└── dist/                 # Build output (genereras av Vite)
```

## 🎨 Features

- **CSV Import** - Importera tävlingsresultat från CSV
- **Poängberäkning** - Automatisk beräkning med olika poängsystem
- **Resultathantering** - Editera, filtrera och hantera resultat
- **Dubblettdetektering** - Hitta och slå ihop dubbletter
- **Export/Import** - Spara och ladda data som JSON
- **GravitySeries Design** - Modern, ljus design

## 🛠️ Teknisk Stack

- React 19 + Vite
- Tailwind CSS med custom GravitySeries tokens
- Lucide React ikoner

## 🚢 Deploy

Appen deployas automatiskt till GitHub Pages via GitHub Actions när ändringar pushas till branchen.

**Live:** https://ecabbike.github.io/Resultsdatabase/
