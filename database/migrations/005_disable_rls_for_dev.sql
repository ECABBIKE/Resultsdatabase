-- Migration 005: Disable RLS for development
-- This is the simplest solution - just turn off RLS completely

-- Disable RLS on all tables
ALTER TABLE competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE series DISABLE ROW LEVEL SECURITY;
ALTER TABLE competition_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE cyclists DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE series_competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE club_aliases DISABLE ROW LEVEL SECURITY;
ALTER TABLE licensed_cyclists DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (cleanup)
DROP POLICY IF EXISTS "Allow all operations on competitions" ON competitions;
DROP POLICY IF EXISTS "Allow all operations on series" ON series;
DROP POLICY IF EXISTS "Allow all operations on competition_classes" ON competition_classes;
DROP POLICY IF EXISTS "Allow all operations on scoring_templates" ON scoring_templates;
DROP POLICY IF EXISTS "Allow all operations on cyclists" ON cyclists;
DROP POLICY IF EXISTS "Allow all operations on results" ON results;
DROP POLICY IF EXISTS "Allow all operations on venues" ON venues;
DROP POLICY IF EXISTS "Allow all operations on series_competitions" ON series_competitions;
DROP POLICY IF EXISTS "Allow all operations on club_aliases" ON club_aliases;
DROP POLICY IF EXISTS "Allow all operations on licensed_cyclists" ON licensed_cyclists;

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

DROP POLICY IF EXISTS "Enable read access for all users" ON series_competitions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON series_competitions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON series_competitions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON series_competitions;

DROP POLICY IF EXISTS "Enable read access for all users" ON club_aliases;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON club_aliases;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON club_aliases;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON club_aliases;

COMMENT ON TABLE competitions IS 'RLS disabled for development - all operations allowed';
COMMENT ON TABLE series IS 'RLS disabled for development - all operations allowed';
COMMENT ON TABLE competition_classes IS 'RLS disabled for development - all operations allowed';
