BEGIN;

ALTER TABLE patients ADD COLUMN IF NOT EXISTS death_date DATE;

DO $$
BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'm'
      AND n.nspname = 'public'
      AND c.relname = 'patient_health_ratings'
    ) THEN
        DROP MATERIALIZED VIEW patient_health_ratings;
    END IF;

    CREATE MATERIALIZED VIEW patient_health_ratings AS
    SELECT
      p.id AS patient_id,
      p.death_date,
      COALESCE((
        SELECT he.health_check_rating
        FROM entries e
        JOIN healthcheck_entries he ON e.id = he.entry_id
        WHERE e.patient_id = p.id
          AND e.type = 'HealthCheck'
          AND e.is_deleted = false
          AND he.health_check_rating IS NOT NULL
        ORDER BY e.date DESC
        LIMIT 1
      ), -1) AS health_rating
    FROM patients p;

    CREATE INDEX IF NOT EXISTS idx_patient_health_ratings ON patient_health_ratings(health_rating);
    
    RAISE NOTICE 'Added death_date to patients and updated health_rating_view';
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error updating: %', SQLERRM;
END $$;

COMMIT;

BEGIN;

DO $$
BEGIN
    DROP MATERIALIZED VIEW IF EXISTS patient_health_ratings;

    CREATE MATERIALIZED VIEW patient_health_ratings AS
    SELECT
      p.id AS patient_id,
      COALESCE((
        SELECT he.health_check_rating
        FROM entries e
        JOIN healthcheck_entries he ON e.id = he.entry_id
        WHERE e.patient_id = p.id
          AND e.type = 'HealthCheck'
          AND e.is_deleted = false
          AND he.health_check_rating IS NOT NULL
        ORDER BY e.date DESC
        LIMIT 1
      ), -1) AS health_rating
    FROM patients p;

    CREATE INDEX IF NOT EXISTS idx_patient_health_ratings ON patient_health_ratings(health_rating);
END $$;

ALTER TABLE patients DROP COLUMN death_date;

COMMIT;