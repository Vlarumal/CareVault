-- Fix for the updated_at trigger issue: safe trigger function and conditional trigger creation

DROP TRIGGER IF EXISTS update_entries_modtime ON entries;
DROP TRIGGER IF EXISTS update_healthcheck_modtime ON healthcheck_entries;
DROP TRIGGER IF EXISTS update_hospital_modtime ON hospital_entries;
DROP TRIGGER IF EXISTS update_occupational_modtime ON occupational_healthcare_entries;

DROP FUNCTION IF EXISTS update_modified_column();

-- Create the new safe trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION create_trigger_if_column_exists(
  target_table TEXT,
  trigger_name TEXT
) RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = target_table
      AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = trigger_name
  ) THEN
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_modified_column()',
      trigger_name,
      target_table
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT create_trigger_if_column_exists('entries', 'update_entries_modtime');
SELECT create_trigger_if_column_exists('healthcheck_entries', 'update_healthcheck_modtime');
SELECT create_trigger_if_column_exists('hospital_entries', 'update_hospital_modtime');
SELECT create_trigger_if_column_exists('occupational_healthcare_entries', 'update_occupational_modtime');