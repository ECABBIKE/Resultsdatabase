# GravitySeries - The HUB (Frontend)

React + TypeScript frontend för GravitySeries - The HUB.

## 🚀 Snabbstart

### 1. Förutsättningar

- Node.js 18+ installerat
- En uppsatt Supabase-databas (se `/database/SETUP.md`)

### 2. Installation

```bash
# Installera dependencies
npm install

# Kopiera environment variables
cp .env.example .env
```

### 3. Konfigurera Supabase

Redigera `.env` och lägg till dina Supabase-uppgifter:

```env
VITE_SUPABASE_URL=https://din-projekt-id.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-key-här
```

Du hittar dessa värden i Supabase Dashboard → Settings → API.

### 4. Starta utvecklingsserver

```bash
npm run dev
```

Öppna [http://localhost:5173](http://localhost:5173) i din webbläsare.

## 📁 Projektstruktur

```
src/
├── components/      # Återanvändbara React-komponenter
│   ├── Layout.tsx   # Huvudlayout med navigation
│   └── Navigation.tsx
├── pages/           # Sidkomponenter
│   ├── Home.tsx
│   ├── Competitions.tsx
│   ├── Series.tsx
│   ├── Cyclists.tsx
│   ├── Calendar.tsx
│   ├── Statistics.tsx
│   └── Admin.tsx
├── lib/             # Utilities och konfiguration
│   ├── supabase.ts  # Supabase client
│   └── utils.ts     # Hjälpfunktioner
├── types/           # TypeScript typer
│   └── database.ts  # Databas-typedefs
├── hooks/           # Custom React hooks
├── App.tsx          # Huvudkomponent med routing
├── main.tsx         # Entry point
└── index.css        # Global CSS med Tailwind

```

## 🛠️ Teknologier

- **React 18** - UI-bibliotek
- **TypeScript** - Typsäkerhet
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **TanStack Query** - Data fetching & caching
- **Supabase** - Backend (PostgreSQL + Auth + Storage)
- **date-fns** - Datumhantering

## 📦 Tillgängliga kommandon

```bash
# Utveckling
npm run dev          # Starta dev server (port 5173)

# Produktion
npm run build        # Bygg för produktion
npm run preview      # Förhandsgranska produktionsbygge

# Kodkvalitet
npm run lint         # Kör ESLint
```

## 🎨 Design System

### Färgschema (Dark Mode)

- **Primary:** Blå accent (`primary-500` till `primary-900`)
- **Dark:** Mörkgrå bakgrunder (`dark-700` till `dark-900`)
- **Text:** Ljusgrå till vit (`gray-100` till `white`)

### Återanvändbara CSS-klasser

```css
/* Cards */
.card              /* Standardkort med border och shadow */

/* Knappar */
.btn-primary       /* Primär knapp (blå) */
.btn-secondary     /* Sekundär knapp (grå) */
.btn-danger        /* Röd knapp för destructive actions */

/* Input */
.input             /* Standardinmatningsfält */

/* Tabeller */
.table-container   /* Wrapper för tabeller */
.table             /* Tabell med mörk styling */
```

## 🔐 Autentisering

Autentisering hanteras via Supabase Auth. För att testa admin-funktioner:

1. Skapa en användare i Supabase Dashboard → Authentication → Users
2. Lägg till användaren i `admin_profiles`-tabellen (se `/database/SETUP.md`)

## 📊 Data Fetching

Vi använder TanStack Query för all data fetching. Exempel:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('published', true);

      if (error) throw error;
      return data;
    },
  });

  // ...
}
```

## 🌐 Deployment

### Vercel (Rekommenderat)

1. Pusha koden till GitHub
2. Gå till [vercel.com](https://vercel.com)
3. Importera ditt repo
4. Lägg till environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

### Andra alternativ

- **Netlify:** Fungerar likadant som Vercel
- **GitHub Pages:** Kräver några extra steg för routing
- **Egen server:** Bygg med `npm run build` och servera `dist/`-mappen

## 🐛 Felsökning

### Blank sida efter deploy

- Kontrollera att environment variables är korrekt satta
- Kolla browser console för fel
- Verifiera att Supabase URL och key är korrekta

### "Missing Supabase environment variables"

- Skapa en `.env`-fil baserad på `.env.example`
- Lägg till dina Supabase-uppgifter
- Starta om dev server

### CORS-fel från Supabase

- Gå till Supabase Dashboard → Settings → API
- Under "API Settings" → "CORS", lägg till din frontend-URL
- För localhost: `http://localhost:5173`

## 📝 Nästa steg

- [ ] Implementera komplett Competitions-sida med filter och sök
- [ ] Bygga Series-sida med standings
- [ ] Skapa Cyclist-profiler med historik
- [ ] Implementera Admin-panel med CRUD
- [ ] Lägg till autentisering och RLS
- [ ] Skapa resultatimport-funktionalitet
- [ ] Bygga statistiksida med grafer

## 🤝 Bidra

Detta är ett privat projekt, men om du vill bidra:

1. Skapa en feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit dina ändringar (`git commit -m 'Add some AmazingFeature'`)
3. Pusha till branchen (`git push origin feature/AmazingFeature`)
4. Öppna en Pull Request

## 📄 Licens

Privat projekt - Alla rättigheter förbehållna.
