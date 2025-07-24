-- Add idnumber column as an alias for id_number to fix compatibility issues
-- The functions expect 'idnumber' but the table has 'id_number'

-- First, add the idnumber column if it doesn't exist
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS idnumber TEXT;

-- Copy existing data from id_number to idnumber
UPDATE artworks 
SET idnumber = id_number 
WHERE idnumber IS NULL;

-- Create a trigger to keep idnumber in sync with id_number
CREATE OR REPLACE FUNCTION sync_idnumber()
RETURNS TRIGGER AS $$
BEGIN
    NEW.idnumber := NEW.id_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS sync_idnumber_trigger ON artworks;

-- Create the trigger
CREATE TRIGGER sync_idnumber_trigger
BEFORE INSERT OR UPDATE ON artworks
FOR EACH ROW
EXECUTE FUNCTION sync_idnumber();