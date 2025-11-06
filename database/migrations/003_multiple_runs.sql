-- Migration: Add support for multiple runs (DH format)
-- Description: Support DH competitions with multiple runs where both count

-- Add run_number to results table
ALTER TABLE results
ADD COLUMN run_number INTEGER DEFAULT 1,
ADD COLUMN run_type VARCHAR(50); -- 'seeding', 'qualification', 'final', 'run1', 'run2', etc.

-- Drop old unique constraint
ALTER TABLE results
DROP CONSTRAINT IF EXISTS results_competition_id_cyclist_id_class_id_key;

-- Add new unique constraint including run_number
ALTER TABLE results
ADD CONSTRAINT results_competition_cyclist_class_run_unique
UNIQUE(competition_id, cyclist_id, class_id, run_number);

-- Add index for run queries
CREATE INDEX idx_results_run ON results(competition_id, run_number);
CREATE INDEX idx_results_run_type ON results(run_type);

-- Add columns for split times (stages)
-- stage_times already exists as JSONB, but let's add a comment
COMMENT ON COLUMN results.stage_times IS 'Array of split/stage times: [{"stage": 1, "time": "00:02:34.567"}, ...]. For Enduro: up to 15 stages. For DH: up to 4 splits.';
COMMENT ON COLUMN results.run_number IS 'Run number for formats with multiple runs (e.g., DH with 2 runs)';
COMMENT ON COLUMN results.run_type IS 'Type of run: seeding, qualification, final, run1, run2, etc.';
