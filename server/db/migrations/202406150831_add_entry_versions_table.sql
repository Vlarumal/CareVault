DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'entry_versions') THEN
    CREATE TABLE entry_versions (
  id UUID PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  editor_id TEXT NOT NULL,
  change_reason TEXT NOT NULL,
  entry_data JSONB NOT NULL CHECK (
    jsonb_typeof(entry_data) = 'object' AND
    (
      (entry_data->>'type' = 'HealthCheck' AND (entry_data->'healthCheckRating')::int BETWEEN 0 AND 3) OR
      (entry_data->>'type' = 'Hospital' AND jsonb_typeof(entry_data->'discharge') = 'object') OR
      (entry_data->>'type' = 'OccupationalHealthcare' AND jsonb_typeof(entry_data->'employerName') = 'string')
    )
  ),
  data_checksum TEXT NOT NULL,
  CONSTRAINT data_checksum_not_empty CHECK (data_checksum <> ''),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('CREATE','UPDATE','DELETE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

    CREATE INDEX idx_entry_versions_entry_id ON entry_versions(entry_id);
    CREATE INDEX idx_entry_versions_created_at ON entry_versions(created_at);
    CREATE INDEX idx_entry_versions_operation ON entry_versions(operation_type);

    COMMENT ON TABLE entry_versions IS 'Stores version history for patient medical entries with data integrity checks';
    COMMENT ON COLUMN entry_versions.data_checksum IS 'MD5 checksum of entry_data for validation';
  END IF;
END $$;
COMMENT ON TABLE entry_versions IS 'Stores version history for patient medical entries with data integrity checks';
COMMENT ON COLUMN entry_versions.data_checksum IS 'MD5 checksum of entry_data for validation';