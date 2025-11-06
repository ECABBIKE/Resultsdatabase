# GravitySeries - The HUB Database Schema

## 📊 Översikt

Detta är databasschemat för GravitySeries - The HUB. Databasen är designad för PostgreSQL och optimerad för Supabase.

## 🗃️ Tabeller

### Core Tables

#### `venues` - Anläggningar
Platser där tävlingar hålls.
- `id` - UUID, primary key
- `name` - Namn på anläggningen
- `city` - Stad/ort
- `description` - Beskrivning
- `latitude`, `longitude` - GPS-koordinater

#### `cyclists` - Cyklister
Alla cyklister i systemet.
- `id` - UUID, primary key
- `uci_id` - UCI ID (unikt, kan vara NULL för nya cyklister)
- `first_name`, `last_name` - Namn
- `club` - Klubbtillhörighet
- `birth_date` - Födelsedatum
- `gender` - Kön
- `email` - E-post (dolt för publik)
- `profile_image_url` - Profilbild URL

#### `licensed_cyclists` - Licensregister
Import av officiella licensierade cyklister.
- `id` - UUID, primary key
- `uci_id` - UCI ID (unikt, NOT NULL)
- `first_name`, `last_name`, `club`, `birth_date`, `gender`
- `license_year` - Licensår
- `license_type`, `license_class` - Licenstyp och klass
- `matched_cyclist_id` - Länk till matchad cyklist i `cyclists`
- `import_date` - När data importerades

#### `competitions` - Tävlingar
Alla tävlingar.
- `id` - UUID, primary key
- `name` - Tävlingsnamn
- `date` - Datum
- `competition_format` - Format (DH, ENDURO, XC, etc.)
- `venue_id` - Koppling till anläggning
- `status` - Status (upcoming, ongoing, completed, cancelled)
- `published` - Om tävlingen är publik

#### `competition_classes` - Tävlingsklasser
Klasser som cyklister tävlar i.
- `id` - UUID, primary key
- `name` - Klassnamn (t.ex. "Elite Men")
- `gender` - Kön
- `age_group` - Åldersgrupp

**Pre-loaded classes:**
- Elite Men/Women
- Youth Men/Women
- Junior Men/Women
- Masters Men/Women

#### `series` - Serier
Cuper/serier som består av flera tävlingar.
- `id` - UUID, primary key
- `name` - Serienamn
- `year` - År
- `type` - Typ: 'individual' eller 'club'
- `point_system` - JSONB array med poäng [500, 450, 425, ...]
- `count_best_results` - Antal resultat som räknas (NULL = alla)
- `club_top_riders_per_class` - För klubbserier: hur många toppryttare per klass

#### `series_competitions` - Serie ↔ Tävling (Many-to-Many)
Kopplar tävlingar till serier.
- `series_id` - Koppling till serie
- `competition_id` - Koppling till tävling
- `point_multiplier` - Poängmultiplikator (t.ex. 1.5)
- `weight` - Vikt/viktighet

#### `results` - Resultat
Alla tävlingsresultat.
- `id` - UUID, primary key
- `competition_id` - Vilken tävling
- `cyclist_id` - Vilken cyklist
- `class_id` - Vilken klass
- `position` - Placering
- `total_time` - Total tid (PostgreSQL INTERVAL)
- `stage_times` - JSONB array med sträcktider
- `time_behind_leader` - Tid efter ledaren
- `status` - Status (FIN, DNF, DNS, DSQ)
- `bib_number` - Startnummer

#### `series_results` - Serieresultat
Beräknade poäng för resultat i serier.
- `id` - UUID, primary key
- `series_id` - Vilken serie
- `result_id` - Vilket resultat
- `cyclist_id` - Vilken cyklist
- `points` - Baspoäng
- `adjusted_points` - Justerade poäng (efter multiplikator)
- `club_name` - Klubb (för klubbserier)
- `counts_for_club` - Om resultatet räknas för klubbtotal

#### `admin_profiles` - Admin-användare
Metadata för admin-användare.
- `id` - UUID (kopplad till auth.users)
- `full_name` - Namn
- `role` - Roll (admin, super_admin, editor)
- `permissions` - JSONB med behörigheter

## 📈 Views

### `series_standings`
Färdig vy för serieställningar (individuell).
```sql
SELECT * FROM series_standings WHERE series_id = 'xxx';
```

### `club_series_standings`
Färdig vy för klubbserieställningar.
```sql
SELECT * FROM club_series_standings WHERE series_id = 'xxx';
```

## 🔒 Row Level Security (RLS)

### Publikt (alla):
- ✅ Läsa publicerade tävlingar (`published = TRUE`)
- ✅ Läsa publicerade serier (`published = TRUE`)
- ✅ Läsa alla cyklister
- ✅ Läsa alla anläggningar
- ✅ Läsa resultat för publicerade tävlingar

### Admins (inloggade med admin-roll):
- ✅ Full access till allt (CRUD)

## 🚀 Användning

### 1. Skapa Supabase-projekt
1. Gå till [supabase.com](https://supabase.com)
2. Skapa nytt projekt
3. Vänta tills projektet är klart

### 2. Kör SQL-schemat
1. Öppna SQL Editor i Supabase
2. Kopiera innehållet från `schema.sql`
3. Kör scriptet

### 3. Första admin-användare
```sql
-- Efter att du skapat en användare via Supabase Auth:
INSERT INTO admin_profiles (id, full_name, role)
VALUES ('your-user-uuid', 'Ditt Namn', 'super_admin');
```

## 📝 Exempel-queries

### Hämta senaste tävlingarna
```sql
SELECT c.*, v.name as venue_name, v.city
FROM competitions c
LEFT JOIN venues v ON c.venue_id = v.id
WHERE c.published = TRUE
ORDER BY c.date DESC
LIMIT 10;
```

### Hämta resultat för en tävling
```sql
SELECT
    r.*,
    c.first_name,
    c.last_name,
    c.club,
    cc.name as class_name
FROM results r
JOIN cyclists c ON r.cyclist_id = c.id
JOIN competition_classes cc ON r.class_id = cc.id
WHERE r.competition_id = 'xxx'
AND r.status = 'FIN'
ORDER BY cc.name, r.position;
```

### Hämta serieställning
```sql
SELECT *
FROM series_standings
WHERE series_id = 'xxx'
ORDER BY total_points DESC;
```

### Importera licensierade cyklister
```sql
-- Importera från CSV
INSERT INTO licensed_cyclists (uci_id, first_name, last_name, club, birth_date, gender, license_year, license_class)
VALUES ('10138828101', 'Edvin', 'Ernfors', 'Järfälla CK', '2009-04-01', 'Men', 2024, 'Youth Men');

-- Matcha mot befintlig cyklist
UPDATE licensed_cyclists
SET matched_cyclist_id = (SELECT id FROM cyclists WHERE uci_id = '10138828101')
WHERE uci_id = '10138828101';
```

## 🔗 Relationer

```
venues
  ↓
competitions ←→ series (via series_competitions)
  ↓
results ←→ series_results
  ↓
cyclists
```

## 🎯 Nästa steg

1. ✅ Databasschemat klart
2. ⏳ Sätt upp Supabase
3. ⏳ Bygg React frontend
4. ⏳ Koppla API till frontend
