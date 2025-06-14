DO $$
BEGIN
    -- Drop existing view if it exists
    -- Check if materialized view exists in public schema
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'm' -- 'm' indicates materialized view
      AND n.nspname = 'public' -- Default schema
      AND c.relname = 'patient_health_ratings'
    ) THEN
        DROP MATERIALIZED VIEW patient_health_ratings;
    END IF;

    -- Create new view with all patients
    CREATE MATERIALIZED VIEW patient_health_ratings AS
    SELECT
      p.id AS patient_id,
      COALESCE((
        SELECT he.health_check_rating
        FROM entries e
        JOIN healthcheck_entries he ON e.id = he.entry_id
        WHERE e.patient_id = p.id
          AND e.type = 'HealthCheck'
          AND he.health_check_rating IS NOT NULL
        ORDER BY e.date DESC
        LIMIT 1
      ), -1) AS health_rating
    FROM patients p;

    -- Create index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_patient_health_ratings'
    ) THEN
        CREATE INDEX idx_patient_health_ratings ON patient_health_ratings(health_rating);
    END IF;
    
    RAISE NOTICE 'Materialized view patient_health_ratings created successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating materialized view: %', SQLERRM;
END $$;