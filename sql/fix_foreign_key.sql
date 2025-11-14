-- Fix Foreign Key Constraint Issue
-- Run this in Supabase SQL Editor

-- Option 1: Drop the foreign key constraint (recommended for simplicity)
-- This allows sold_to to be a simple text field with team name
ALTER TABLE players 
DROP CONSTRAINT IF EXISTS players_sold_to_fkey;

-- Verify the constraint is removed
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'players' 
AND constraint_name LIKE '%sold_to%';

-- Check current data
SELECT player_id, name, status, sold_to, sold_price 
FROM players 
LIMIT 5;
