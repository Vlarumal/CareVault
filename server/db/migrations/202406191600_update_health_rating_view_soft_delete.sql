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
    
    RAISE NOTICE 'Materialized view patient_health_ratings updated with soft delete filtering';
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error updating materialized view: %', SQLERRM;
END $$;