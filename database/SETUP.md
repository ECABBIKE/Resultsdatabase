# GravitySeries - The HUB: Supabase Setup Guide

## Steg 1: Skapa Supabase-konto och projekt

1. Gå till [supabase.com](https://supabase.com)
2. Klicka på "Start your project" eller "Sign up"
3. Logga in med GitHub (rekommenderat) eller email
4. När du är inloggad, klicka på "New project"
5. Fyll i projektinformation:
   - **Name:** GravitySeries-Hub (eller valfritt namn)
   - **Database Password:** Välj ett starkt lösenord (spara detta säkert!)
   - **Region:** Välj "North EU (Europe)" för bästa prestanda i Sverige
   - **Pricing Plan:** Free (gratis upp till 500 MB databas + 2 GB bandwidth/månad)
6. Klicka "Create new project"
7. Vänta 1-2 minuter medan Supabase skapar ditt projekt

## Steg 2: Kör databasschemat

1. När projektet är klart, klicka på **SQL Editor** i vänstermenyn
2. Klicka på **+ New query**
3. Öppna filen `schema.sql` från detta repo
4. Kopiera **hela innehållet** (alla 400 rader)
5. Klistra in i SQL Editor i Supabase
6. Klicka på **Run** (eller tryck Ctrl+Enter / Cmd+Enter)
7. Du bör se meddelanden om att tabeller och policies har skapats

**Verifiera:** Du bör se meddelanden som:
```
CREATE EXTENSION
CREATE TABLE
CREATE INDEX
...
CREATE POLICY
```

## Steg 3: Ladda testdata (valfritt men rekommenderat)

1. Klicka på **+ New query** igen
2. Öppna filen `seed_data.sql`
3. Kopiera hela innehållet
4. Klistra in i SQL Editor
5. Klicka **Run**

**Verifiera:** Längst ner i outputen bör du se:
```
Venues created: 3
Cyclists created: 5
Competitions created: 3
Series created: 3
Results created: 7
Series results created: 8
```

Plus en tabell med serieställningar och klubbställningar.

## Steg 4: Skapa första admin-användaren

1. Gå till **Authentication** → **Users** i vänstermenyn
2. Klicka **Add user** → **Create new user**
3. Fyll i:
   - **Email:** Din email
   - **Password:** Välj ett lösenord
   - **Auto Confirm User:** ✅ (kryssa i denna!)
4. Klicka **Create user**
5. **Kopiera användarens UUID** (den långa koden som börjar med något liknande `a1b2c3d4-...`)
6. Gå tillbaka till **SQL Editor**
7. Kör denna query (byt ut `'YOUR-UUID-HERE'`):

```sql
INSERT INTO admin_profiles (id, full_name, role)
VALUES ('YOUR-UUID-HERE', 'Ditt Namn', 'super_admin');
```

**Exempel:**
```sql
INSERT INTO admin_profiles (id, full_name, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'John Doe', 'super_admin');
```

## Steg 5: Hämta API-nycklar för frontend

1. Gå till **Settings** → **API** i vänstermenyn
2. Du kommer att behöva två värden:

### Project URL
Ser ut så här: `https://abcdefghijklmnop.supabase.co`

### API Keys
- **anon / public:** Denna är säker att använda i frontend (börjar med `eyJ...`)
- **service_role:** ANVÄND INTE DENNA I FRONTEND! (endast för backend/server-side)

Kopiera **anon public** nyckeln.

## Steg 6: Testa databasen

Kör dessa queries i SQL Editor för att verifiera att allt fungerar:

### Hämta alla tävlingar
```sql
SELECT c.*, v.name as venue_name, v.city
FROM competitions c
LEFT JOIN venues v ON c.venue_id = v.id
ORDER BY c.date DESC;
```

### Hämta serieställning för Swedish DH Cup
```sql
SELECT *
FROM series_standings
WHERE series_id = '850e8400-e29b-41d4-a716-446655440001'
ORDER BY total_points DESC;
```

### Hämta alla cyklister
```sql
SELECT * FROM cyclists ORDER BY last_name;
```

Om alla queries returnerar data, är databasen korrekt uppsatt! 🎉

## Steg 7: Nästa steg

Nu när databasen är klar kan vi:

1. ✅ Databas uppsatt och fungerande
2. ⏳ Skapa React frontend
3. ⏳ Koppla Supabase till frontend
4. ⏳ Bygga första sidan (Hem)
5. ⏳ Implementera authentication
6. ⏳ Bygga adminpanel

## Felsökning

### Problem: "permission denied for table X"
**Lösning:** Du är inte inloggad som admin. Se till att du har kört INSERT INTO admin_profiles för din användare.

### Problem: "relation does not exist"
**Lösning:** Schema har inte körts korrekt. Kör schema.sql igen.

### Problem: "duplicate key value violates unique constraint"
**Lösning:** Om du kör seed_data.sql flera gånger, ta först bort all data:
```sql
TRUNCATE venues, cyclists, competitions, series, results, series_results CASCADE;
```

### Problem: Kan inte logga in i frontend
**Lösning:**
1. Kontrollera att användaren finns i Authentication → Users
2. Kontrollera att "Auto Confirm User" var ikryssad
3. Kontrollera att användaren finns i admin_profiles tabellen

## Resurser

- [Supabase Dokumentation](https://supabase.com/docs)
- [PostgreSQL Dokumentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
