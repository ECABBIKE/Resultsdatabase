-- Migration 004: Auto UCI ID generation and club name normalization
-- This migration adds support for auto-generated cyclist IDs and club name normalization

-- Add generated_id column for cyclists without UCI ID
ALTER TABLE cyclists
ADD COLUMN generated_id VARCHAR(50) UNIQUE,
ADD COLUMN is_generated_id BOOLEAN DEFAULT FALSE;

-- Create club_aliases table for normalizing club names
CREATE TABLE IF NOT EXISTS club_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_name VARCHAR(255) NOT NULL UNIQUE, -- The correct/official club name
    alias VARCHAR(255) NOT NULL, -- A variant/misspelling
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on alias for fast lookups
CREATE INDEX idx_club_aliases_alias ON club_aliases(alias);

-- Function to generate unique cyclist ID
-- Format: GEN + year + sequential number (e.g., GEN2025001)
CREATE OR REPLACE FUNCTION generate_cyclist_id(birth_year INTEGER DEFAULT NULL)
RETURNS VARCHAR(50) AS $$
DECLARE
    year_part VARCHAR(4);
    counter INTEGER;
    new_id VARCHAR(50);
    exists_check BOOLEAN;
BEGIN
    -- Use birth year if provided, otherwise current year
    IF birth_year IS NULL THEN
        year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    ELSE
        year_part := birth_year::VARCHAR;
    END IF;

    -- Find next available counter for this year
    counter := 1;
    LOOP
        new_id := 'GEN' || year_part || LPAD(counter::VARCHAR, 3, '0');

        -- Check if ID exists in either uci_id or generated_id
        SELECT EXISTS(
            SELECT 1 FROM cyclists
            WHERE uci_id = new_id OR generated_id = new_id
        ) INTO exists_check;

        EXIT WHEN NOT exists_check;
        counter := counter + 1;
    END LOOP;

    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to find canonical club name
CREATE OR REPLACE FUNCTION get_canonical_club_name(club_input VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    canonical VARCHAR(255);
BEGIN
    IF club_input IS NULL OR club_input = '' THEN
        RETURN NULL;
    END IF;

    -- First check if there's an exact alias match
    SELECT canonical_name INTO canonical
    FROM club_aliases
    WHERE LOWER(alias) = LOWER(club_input)
    LIMIT 1;

    IF canonical IS NOT NULL THEN
        RETURN canonical;
    END IF;

    -- If no alias found, check if it's already a canonical name
    SELECT canonical_name INTO canonical
    FROM club_aliases
    WHERE LOWER(canonical_name) = LOWER(club_input)
    LIMIT 1;

    IF canonical IS NOT NULL THEN
        RETURN canonical;
    END IF;

    -- If not found in aliases, return original (might be correct or new club)
    RETURN club_input;
END;
$$ LANGUAGE plpgsql;

-- Populate club_aliases with common Swedish club name variations
-- We'll extract these from licensed_cyclists table
INSERT INTO club_aliases (canonical_name, alias)
SELECT DISTINCT
    club as canonical_name,
    club as alias
FROM licensed_cyclists
WHERE club IS NOT NULL AND club != ''
ON CONFLICT (canonical_name) DO NOTHING;

-- Add some common misspellings/variations (can be expanded)
-- Example patterns (these would be customized based on real data)
INSERT INTO club_aliases (canonical_name, alias) VALUES
('Järvsö CK', 'Jarvso CK'),
('Järvsö CK', 'Järvsö Cykelklubb'),
('Åre Bike Park', 'Are Bike Park'),
('Åre Bike Park', 'ÅBP')
ON CONFLICT (canonical_name) DO NOTHING;

COMMENT ON TABLE club_aliases IS 'Maps club name variations to canonical names for data consistency';
COMMENT ON COLUMN cyclists.generated_id IS 'Auto-generated ID for cyclists without UCI ID (format: GEN + year + sequence)';
COMMENT ON COLUMN cyclists.is_generated_id IS 'TRUE if the cyclist ID was auto-generated';
