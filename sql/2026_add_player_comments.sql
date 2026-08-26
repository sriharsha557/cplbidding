-- Adds the registration Comments field to players.
--
-- Registrants describe themselves in their own words ("Opening or 1 down
-- Batsman", "Available for 1st two weeks"). Showing that on the live auction
-- card is the only context owners get on someone they do not know.
--
-- Safe to re-run.

ALTER TABLE players ADD COLUMN IF NOT EXISTS comments TEXT;
