CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set updated_at if the column exists
  IF TG_NARGS > 0 AND TG_ARGV[0] = 'skip' THEN
    -- Skip update for specific cases
    RETURN NEW;
  END IF;
  
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = TG_TABLE_NAME
      AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  PERFORM create_trigger_if_column_exists('entries', 'update_entries_modtime');
  PERFORM create_trigger_if_column_exists('healthcheck_entries', 'update_healthcheck_modtime');
  PERFORM create_trigger_if_column_exists('hospital_entries', 'update_hospital_modtime');
  PERFORM create_trigger_if_column_exists('occupational_healthcare_entries', 'update_occupational_modtime');
END $$;

CREATE OR REPLACE FUNCTION create_trigger_if_column_exists(
  table_name TEXT,
  trigger_name TEXT
) RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = create_trigger_if_column_exists.table_name
      AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = create_trigger_if_column_exists.trigger_name
  ) THEN
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_modified_column()',
      trigger_name,
      table_name
    );
  END IF;
END;
$$ LANGUAGE plpgsql;