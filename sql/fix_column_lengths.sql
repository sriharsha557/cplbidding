-- Fix Column Length Issues in Supabase
-- Run this in Supabase SQL Editor

-- Update players table - increase sold_to column length
ALTER TABLE players 
ALTER COLUMN sold_to TYPE VARCHAR(50);

-- Also ensure status column is long enough
ALTER TABLE players 
ALTER COLUMN status TYPE VARCHAR(20);

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name IN ('sold_to', 'status');
