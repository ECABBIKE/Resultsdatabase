-- Migration: Add Scoring Templates
-- Description: Add scoring templates for different competition formats (Enduro, DH Seeding, DH Final, etc.)

-- ============================================
-- SCORING TEMPLATES (Kvalpoängsmallar)
-- ============================================
CREATE TABLE scoring_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    format_type VARCHAR(100) NOT NULL, -- 'enduro', 'dh_seeding', 'dh_final', 'xc', etc.
    description TEXT,

    -- Points mapping: { "1": 500, "2": 450, "3": 425, ... }
    -- For positions that finish (FIN status)
    points_map JSONB NOT NULL,

    -- Optional: DNF, DNS points
    dnf_points INTEGER DEFAULT 0,
    dns_points INTEGER DEFAULT 0,

    -- Is this template active/available?
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scoring_templates_format ON scoring_templates(format_type);
CREATE INDEX idx_scoring_templates_active ON scoring_templates(is_active);

-- ============================================
-- ALTER COMPETITIONS - Add scoring template references
-- ============================================
ALTER TABLE competitions
ADD COLUMN scoring_template_id UUID REFERENCES scoring_templates(id) ON DELETE SET NULL;

-- For DH competitions that have both seeding and final
ALTER TABLE competitions
ADD COLUMN dh_seeding_template_id UUID REFERENCES scoring_templates(id) ON DELETE SET NULL,
ADD COLUMN dh_final_template_id UUID REFERENCES scoring_templates(id) ON DELETE SET NULL;

CREATE INDEX idx_competitions_scoring_template ON competitions(scoring_template_id);

-- ============================================
-- ALTER SERIES - Add scoring template reference
-- ============================================
ALTER TABLE series
ADD COLUMN scoring_template_id UUID REFERENCES scoring_templates(id) ON DELETE SET NULL;

CREATE INDEX idx_series_scoring_template ON series(scoring_template_id);

-- ============================================
-- SEED DEFAULT SCORING TEMPLATES
-- ============================================

-- Enduro standard points (UCI based)
INSERT INTO scoring_templates (name, format_type, description, points_map) VALUES
('Enduro - UCI Standard', 'enduro', 'UCI standard poäng för Enduro',
'{
  "1": 500, "2": 450, "3": 425, "4": 405, "5": 390, "6": 375, "7": 360, "8": 350, "9": 340, "10": 330,
  "11": 320, "12": 310, "13": 300, "14": 290, "15": 280, "16": 270, "17": 260, "18": 250, "19": 240, "20": 230,
  "21": 220, "22": 210, "23": 200, "24": 195, "25": 190, "26": 185, "27": 180, "28": 175, "29": 170, "30": 165,
  "31": 160, "32": 155, "33": 150, "34": 145, "35": 140, "36": 135, "37": 130, "38": 125, "39": 120, "40": 115,
  "41": 110, "42": 105, "43": 100, "44": 95, "45": 90, "46": 85, "47": 80, "48": 75, "49": 70, "50": 65
}'::jsonb);

-- DH Seeding points
INSERT INTO scoring_templates (name, format_type, description, points_map) VALUES
('DH - Seeding', 'dh_seeding', 'Poäng för DH seedning',
'{
  "1": 100, "2": 90, "3": 85, "4": 80, "5": 78, "6": 75, "7": 72, "8": 70, "9": 68, "10": 65,
  "11": 62, "12": 60, "13": 58, "14": 56, "15": 54, "16": 52, "17": 50, "18": 48, "19": 46, "20": 44,
  "21": 42, "22": 40, "23": 38, "24": 36, "25": 34, "26": 32, "27": 30, "28": 28, "29": 26, "30": 24,
  "31": 22, "32": 20, "33": 18, "34": 16, "35": 14, "36": 12, "37": 10, "38": 8, "39": 6, "40": 4
}'::jsonb);

-- DH Final points
INSERT INTO scoring_templates (name, format_type, description, points_map) VALUES
('DH - Final (UCI)', 'dh_final', 'UCI standard poäng för DH final',
'{
  "1": 500, "2": 450, "3": 425, "4": 405, "5": 390, "6": 375, "7": 360, "8": 350, "9": 340, "10": 330,
  "11": 320, "12": 310, "13": 300, "14": 290, "15": 280, "16": 270, "17": 260, "18": 250, "19": 240, "20": 230,
  "21": 220, "22": 210, "23": 200, "24": 195, "25": 190, "26": 185, "27": 180, "28": 175, "29": 170, "30": 165,
  "31": 160, "32": 155, "33": 150, "34": 145, "35": 140, "36": 135, "37": 130, "38": 125, "39": 120, "40": 115,
  "41": 110, "42": 105, "43": 100, "44": 95, "45": 90, "46": 85, "47": 80, "48": 75, "49": 70, "50": 65
}'::jsonb);

-- Enduro - Swedish Series points (example)
INSERT INTO scoring_templates (name, format_type, description, points_map) VALUES
('Enduro - Svenska Serien', 'enduro', 'Poängmall för Svenska Enduroserien',
'{
  "1": 100, "2": 95, "3": 90, "4": 86, "5": 82, "6": 79, "7": 76, "8": 73, "9": 70, "10": 68,
  "11": 66, "12": 64, "13": 62, "14": 60, "15": 58, "16": 56, "17": 54, "18": 52, "19": 50, "20": 48,
  "21": 46, "22": 44, "23": 42, "24": 40, "25": 38, "26": 36, "27": 34, "28": 32, "29": 30, "30": 28,
  "31": 26, "32": 24, "33": 22, "34": 20, "35": 18, "36": 16, "37": 14, "38": 12, "39": 10, "40": 8
}'::jsonb);

COMMENT ON TABLE scoring_templates IS 'Templates for scoring different competition formats';
COMMENT ON COLUMN scoring_templates.points_map IS 'JSON mapping of position to points';
COMMENT ON COLUMN scoring_templates.format_type IS 'Type of competition format: enduro, dh_seeding, dh_final, xc';
