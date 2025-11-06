-- Migration 005: Fix Row Level Security policies for admin operations
-- This migration adds proper RLS policies to allow authenticated users to manage data

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON competitions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON competitions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON competitions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON competitions;

DROP POLICY IF EXISTS "Enable read access for all users" ON series;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON series;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON series;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON series;

DROP POLICY IF EXISTS "Enable read access for all users" ON competition_classes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON competition_classes;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON competition_classes;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON competition_classes;

DROP POLICY IF EXISTS "Enable read access for all users" ON scoring_templates;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON scoring_templates;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON scoring_templates;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON scoring_templates;

DROP POLICY IF EXISTS "Enable read access for all users" ON cyclists;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON cyclists;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON cyclists;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON cyclists;

DROP POLICY IF EXISTS "Enable read access for all users" ON results;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON results;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON results;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON results;

DROP POLICY IF EXISTS "Enable read access for all users" ON venues;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON venues;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON venues;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON venues;

-- Competitions policies
CREATE POLICY "Enable read access for all users" ON competitions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON competitions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for authenticated users only" ON competitions
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable delete for authenticated users only" ON competitions
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Series policies
CREATE POLICY "Enable read access for all users" ON series
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON series
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for authenticated users only" ON series
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable delete for authenticated users only" ON series
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Competition Classes policies
CREATE POLICY "Enable read access for all users" ON competition_classes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON competition_classes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for authenticated users only" ON competition_classes
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable delete for authenticated users only" ON competition_classes
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Scoring Templates policies
CREATE POLICY "Enable read access for all users" ON scoring_templates
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON scoring_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for authenticated users only" ON scoring_templates
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable delete for authenticated users only" ON scoring_templates
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Cyclists policies
CREATE POLICY "Enable read access for all users" ON cyclists
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON cyclists
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for authenticated users only" ON cyclists
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable delete for authenticated users only" ON cyclists
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Results policies
CREATE POLICY "Enable read access for all users" ON results
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON results
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for authenticated users only" ON results
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable delete for authenticated users only" ON results
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Venues policies
CREATE POLICY "Enable read access for all users" ON venues
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON venues
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for authenticated users only" ON venues
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable delete for authenticated users only" ON venues
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Also add policies for related tables
CREATE POLICY "Enable read access for all users" ON series_competitions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON series_competitions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for authenticated users only" ON series_competitions
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable delete for authenticated users only" ON series_competitions
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Club aliases policies
CREATE POLICY "Enable read access for all users" ON club_aliases
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON club_aliases
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for authenticated users only" ON club_aliases
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable delete for authenticated users only" ON club_aliases
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

COMMENT ON POLICY "Enable read access for all users" ON competitions IS 'Allow public read access to competitions';
COMMENT ON POLICY "Enable insert for authenticated users only" ON competitions IS 'Allow authenticated and anon users to create competitions';
COMMENT ON POLICY "Enable update for authenticated users only" ON competitions IS 'Allow authenticated and anon users to update competitions';
COMMENT ON POLICY "Enable delete for authenticated users only" ON competitions IS 'Allow authenticated and anon users to delete competitions';
