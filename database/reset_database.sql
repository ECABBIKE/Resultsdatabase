-- STEG 1: Rensa databasen
-- Kör detta i Supabase SQL Editor för att börja med en ren databas

-- VARNING: Detta raderar ALL data! Säkerhetskopiera först om du vill behålla något.

-- 1. Radera alla resultat
DELETE FROM results;

-- 2. Radera alla serie-tävlings-kopplingar
DELETE FROM series_competitions;

-- 3. Radera alla serier
DELETE FROM series;

-- 4. Radera alla tävlingar
DELETE FROM competitions;

-- 5. Radera alla cyklister (utom de i licensregistret)
DELETE FROM cyclists;

-- 6. Radera alla klasser (kommer skapas automatiskt vid import)
DELETE FROM competition_classes;

-- 7. Radera befintliga scoring templates (vi skapar nya)
DELETE FROM scoring_templates;

-- 8. Radera klubb-aliases (kan behållas eller rensas)
-- DELETE FROM club_aliases; -- Kommentera bort om du vill behålla klubbnamn-mappningar

-- Verifiera att allt är rensat
SELECT 'Results' as table_name, COUNT(*) as count FROM results
UNION ALL
SELECT 'Series', COUNT(*) FROM series
UNION ALL
SELECT 'Competitions', COUNT(*) FROM competitions
UNION ALL
SELECT 'Cyclists', COUNT(*) FROM cyclists
UNION ALL
SELECT 'Classes', COUNT(*) FROM competition_classes
UNION ALL
SELECT 'Scoring Templates', COUNT(*) FROM scoring_templates;

-- Efter att detta körts bör alla räknare visa 0
