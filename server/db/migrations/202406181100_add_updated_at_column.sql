ALTER TABLE entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_entries_modtime'
  ) THEN
    CREATE TRIGGER update_entries_modtime 
    BEFORE UPDATE ON entries 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
  
  -- Repeat for other tables as needed
END $$;