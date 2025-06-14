-- Create materialized view for health ratings
CREATE MATERIALIZED VIEW IF NOT EXISTS patient_health_ratings AS
SELECT
  p.id AS patient_id,
  (SELECT he.health_check_rating
   FROM entries e
   JOIN healthcheck_entries he ON e.id = he.entry_id
   WHERE e.patient_id = p.id
     AND e.type = 'HealthCheck'
   ORDER BY e.date DESC
   LIMIT 1) AS health_rating
FROM patients p;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_patient_health_ratings ON patient_health_ratings(health_rating);