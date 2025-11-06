-- Migration 005 (v2): Fix Row Level Security policies - More permissive approach
-- This completely opens up the tables for the admin panel to work

-- For development, we'll make policies very permissive
-- In production, you should lock these down with proper authentication

-- Competitions
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on competitions" ON competitions;
CREATE POLICY "Allow all operations on competitions" ON competitions
    FOR ALL USING (true) WITH CHECK (true);

-- Series
ALTER TABLE series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on series" ON series;
CREATE POLICY "Allow all operations on series" ON series
    FOR ALL USING (true) WITH CHECK (true);

-- Competition Classes
ALTER TABLE competition_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on competition_classes" ON competition_classes;
CREATE POLICY "Allow all operations on competition_classes" ON competition_classes
    FOR ALL USING (true) WITH CHECK (true);

-- Scoring Templates
ALTER TABLE scoring_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on scoring_templates" ON scoring_templates;
CREATE POLICY "Allow all operations on scoring_templates" ON scoring_templates
    FOR ALL USING (true) WITH CHECK (true);

-- Cyclists
ALTER TABLE cyclists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on cyclists" ON cyclists;
CREATE POLICY "Allow all operations on cyclists" ON cyclists
    FOR ALL USING (true) WITH CHECK (true);

-- Results
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on results" ON results;
CREATE POLICY "Allow all operations on results" ON results
    FOR ALL USING (true) WITH CHECK (true);

-- Venues
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on venues" ON venues;
CREATE POLICY "Allow all operations on venues" ON venues
    FOR ALL USING (true) WITH CHECK (true);

-- Series Competitions
ALTER TABLE series_competitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on series_competitions" ON series_competitions;
CREATE POLICY "Allow all operations on series_competitions" ON series_competitions
    FOR ALL USING (true) WITH CHECK (true);

-- Club Aliases
ALTER TABLE club_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on club_aliases" ON club_aliases;
CREATE POLICY "Allow all operations on club_aliases" ON club_aliases
    FOR ALL USING (true) WITH CHECK (true);

-- Licensed Cyclists
ALTER TABLE licensed_cyclists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on licensed_cyclists" ON licensed_cyclists;
CREATE POLICY "Allow all operations on licensed_cyclists" ON licensed_cyclists
    FOR ALL USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on competitions" ON competitions IS
    'Permissive policy for development - allows all operations without authentication check';
