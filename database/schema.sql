-- GravitySeries - The HUB Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VENUES (Anläggningar)
-- ============================================
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_venues_name ON venues(name);

-- ============================================
-- CYCLISTS (Cyklister)
-- ============================================
CREATE TABLE cyclists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uci_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    club VARCHAR(255),
    birth_date DATE,
    gender VARCHAR(20),
    email VARCHAR(255),
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cyclists_uci_id ON cyclists(uci_id);
CREATE INDEX idx_cyclists_name ON cyclists(last_name, first_name);
CREATE INDEX idx_cyclists_club ON cyclists(club);

-- ============================================
-- LICENSED CYCLISTS (Licensierade cyklister - för import)
-- ============================================
CREATE TABLE licensed_cyclists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uci_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    club VARCHAR(255),
    birth_date DATE,
    gender VARCHAR(20),
    license_year INTEGER NOT NULL,
    license_type VARCHAR(100),
    license_class VARCHAR(100),
    matched_cyclist_id UUID REFERENCES cyclists(id) ON DELETE SET NULL,
    import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_licensed_cyclists_uci_id ON licensed_cyclists(uci_id);
CREATE INDEX idx_licensed_cyclists_year ON licensed_cyclists(license_year);
CREATE INDEX idx_licensed_cyclists_matched ON licensed_cyclists(matched_cyclist_id);

-- ============================================
-- COMPETITIONS (Tävlingar)
-- ============================================
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    competition_format VARCHAR(100) NOT NULL, -- 'DH', 'ENDURO', 'XC', etc.
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_competitions_date ON competitions(date DESC);
CREATE INDEX idx_competitions_format ON competitions(competition_format);
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competitions_venue ON competitions(venue_id);

-- ============================================
-- COMPETITION CLASSES (Tävlingsklasser)
-- ============================================
CREATE TABLE competition_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    age_group VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_competition_classes_name ON competition_classes(name);

-- Seed basic classes
INSERT INTO competition_classes (name, gender, age_group) VALUES
('Elite Men', 'Men', 'Elite'),
('Elite Women', 'Women', 'Elite'),
('Youth Men', 'Men', 'Youth'),
('Youth Women', 'Women', 'Youth'),
('Junior Men', 'Men', 'Junior'),
('Junior Women', 'Women', 'Junior'),
('Masters Men', 'Men', 'Masters'),
('Masters Women', 'Women', 'Masters');

-- ============================================
-- SERIES (Serier)
-- ============================================
CREATE TABLE series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'individual' or 'club'
    point_system JSONB NOT NULL, -- Array of points [500, 450, 425, ...]
    count_best_results INTEGER, -- NULL = count all, otherwise top N results
    description TEXT,
    published BOOLEAN DEFAULT FALSE,

    -- Club series specific settings
    club_top_riders_per_class INTEGER, -- How many top riders per class count for club

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_series_year ON series(year DESC);
CREATE INDEX idx_series_type ON series(type);

-- ============================================
-- SERIES COMPETITIONS (Many-to-Many: Serie <-> Tävling)
-- ============================================
CREATE TABLE series_competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    point_multiplier DECIMAL(3, 2) DEFAULT 1.0, -- e.g., 1.5 for bonus points
    weight INTEGER DEFAULT 1, -- For ordering/importance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(series_id, competition_id)
);

CREATE INDEX idx_series_competitions_series ON series_competitions(series_id);
CREATE INDEX idx_series_competitions_competition ON series_competitions(competition_id);

-- ============================================
-- RESULTS (Resultat)
-- ============================================
CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    cyclist_id UUID NOT NULL REFERENCES cyclists(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES competition_classes(id),
    position INTEGER NOT NULL,
    total_time INTERVAL, -- PostgreSQL interval for time duration
    stage_times JSONB, -- Array of stage times: [{"stage": 1, "time": "00:02:34.567"}, ...]
    time_behind_leader INTERVAL,
    status VARCHAR(20) DEFAULT 'FIN', -- 'FIN', 'DNF', 'DNS', 'DSQ'

    -- Metadata
    bib_number VARCHAR(20),
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(competition_id, cyclist_id, class_id)
);

CREATE INDEX idx_results_competition ON results(competition_id);
CREATE INDEX idx_results_cyclist ON results(cyclist_id);
CREATE INDEX idx_results_class ON results(class_id);
CREATE INDEX idx_results_position ON results(position);
CREATE INDEX idx_results_status ON results(status);

-- ============================================
-- SERIES RESULTS (Mellanobjekt: Koppling Resultat <-> Serie)
-- ============================================
CREATE TABLE series_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    result_id UUID NOT NULL REFERENCES results(id) ON DELETE CASCADE,
    cyclist_id UUID NOT NULL REFERENCES cyclists(id) ON DELETE CASCADE,

    -- Calculated points
    points INTEGER NOT NULL,
    adjusted_points DECIMAL(10, 2), -- After multiplier

    -- Club series specific
    club_name VARCHAR(255), -- For club series results
    counts_for_club BOOLEAN DEFAULT FALSE, -- If this result counts for club total

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(series_id, result_id)
);

CREATE INDEX idx_series_results_series ON series_results(series_id);
CREATE INDEX idx_series_results_result ON series_results(result_id);
CREATE INDEX idx_series_results_cyclist ON series_results(cyclist_id);
CREATE INDEX idx_series_results_club ON series_results(club_name);
CREATE INDEX idx_series_results_points ON series_results(points DESC);

-- ============================================
-- ADMINS (Adminanvändare)
-- ============================================
-- Note: Using Supabase Auth, so this table is optional
-- But we can add custom admin metadata
CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'super_admin', 'editor'
    permissions JSONB, -- Custom permissions object
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Series Standings (Individual)
CREATE VIEW series_standings AS
SELECT
    sr.series_id,
    sr.cyclist_id,
    c.first_name,
    c.last_name,
    c.club,
    cc.name as class_name,
    COUNT(sr.id) as races_completed,
    SUM(sr.adjusted_points) as total_points,
    ARRAY_AGG(sr.adjusted_points ORDER BY sr.adjusted_points DESC) as all_points
FROM series_results sr
JOIN cyclists c ON sr.cyclist_id = c.id
JOIN results r ON sr.result_id = r.id
JOIN competition_classes cc ON r.class_id = cc.id
WHERE r.status = 'FIN'
GROUP BY sr.series_id, sr.cyclist_id, c.first_name, c.last_name, c.club, cc.name;

-- View: Club Series Standings
CREATE VIEW club_series_standings AS
SELECT
    sr.series_id,
    sr.club_name,
    COUNT(DISTINCT sr.cyclist_id) as active_cyclists,
    SUM(sr.adjusted_points) FILTER (WHERE sr.counts_for_club = TRUE) as total_points,
    COUNT(sr.id) FILTER (WHERE sr.counts_for_club = TRUE) as counting_results
FROM series_results sr
WHERE sr.club_name IS NOT NULL
GROUP BY sr.series_id, sr.club_name;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cyclists_updated_at BEFORE UPDATE ON cyclists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON series
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON admin_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE cyclists ENABLE ROW LEVEL SECURITY;
ALTER TABLE licensed_cyclists ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access to published data
CREATE POLICY "Public can view published competitions"
    ON competitions FOR SELECT
    USING (published = TRUE);

CREATE POLICY "Public can view published series"
    ON series FOR SELECT
    USING (published = TRUE);

CREATE POLICY "Public can view all venues"
    ON venues FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can view all cyclists"
    ON cyclists FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can view all competition classes"
    ON competition_classes FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can view results for published competitions"
    ON results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM competitions
            WHERE competitions.id = results.competition_id
            AND competitions.published = TRUE
        )
    );

CREATE POLICY "Public can view series results for published series"
    ON series_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM series
            WHERE series.id = series_results.series_id
            AND series.published = TRUE
        )
    );

-- Admin full access (authenticated users with admin role)
CREATE POLICY "Admins can do everything on competitions"
    ON competitions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE admin_profiles.id = auth.uid()
        )
    );

CREATE POLICY "Admins can do everything on results"
    ON results FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE admin_profiles.id = auth.uid()
        )
    );

CREATE POLICY "Admins can do everything on cyclists"
    ON cyclists FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE admin_profiles.id = auth.uid()
        )
    );

CREATE POLICY "Admins can do everything on series"
    ON series FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_profiles
            WHERE admin_profiles.id = auth.uid()
        )
    );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE venues IS 'Venues where competitions are held';
COMMENT ON TABLE cyclists IS 'Registered cyclists in the system';
COMMENT ON TABLE licensed_cyclists IS 'Import of licensed cyclists from external source';
COMMENT ON TABLE competitions IS 'Competitions';
COMMENT ON TABLE competition_classes IS 'Competition classes (Elite Men, Youth Women, etc.)';
COMMENT ON TABLE series IS 'Series (cups) consisting of multiple competitions';
COMMENT ON TABLE series_competitions IS 'Link between series and competitions';
COMMENT ON TABLE results IS 'Results from competitions';
COMMENT ON TABLE series_results IS 'Calculated points for results in series';
COMMENT ON TABLE admin_profiles IS 'Admin user metadata';
