-- Migration: 202406131230_add_filter_indexes.sql
-- Adds indexes to improve performance of filtering and sorting operations

BEGIN;

-- Index on name column for faster name-based filtering
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);

-- Index on date_of_birth column for faster date-based filtering
CREATE INDEX IF NOT EXISTS idx_patients_date_of_birth ON patients(date_of_birth);

-- Index on gender column for faster gender-based filtering
CREATE INDEX IF NOT EXISTS idx_patients_gender ON patients(gender);

-- Index on occupation column for faster occupation-based filtering
CREATE INDEX IF NOT EXISTS idx_patients_occupation ON patients(occupation);

-- Composite index for common filtering and sorting scenario (name, date_of_birth)
CREATE INDEX IF NOT EXISTS idx_patients_name_dob ON patients(name, date_of_birth);

COMMIT;