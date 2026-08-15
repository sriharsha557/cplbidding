-- CPL 2026 pre-auction migration
-- Run in the Supabase SQL editor.
-- Safe to run more than once.
--
-- Verified 2026-08-15 against the live database:
--   * all tables empty
--   * is_captain / is_vice_captain ALREADY EXIST (not added here)
--   * no players -> teams foreign key; sold_to holds a TEAM NAME as free text

-- 1. New columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'Unknown';
ALTER TABLE players ADD COLUMN IF NOT EXISTS pre_auction_role TEXT;

ALTER TABLE teams ADD COLUMN IF NOT EXISTS pre_auction_submitted BOOLEAN DEFAULT FALSE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS pre_auction_submitted_at TIMESTAMPTZ;

-- 2. Value constraints
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_availability_check;
ALTER TABLE players ADD CONSTRAINT players_availability_check
  CHECK (availability IN ('Unknown', 'Available', 'Unavailable'));

ALTER TABLE players DROP CONSTRAINT IF EXISTS players_pre_auction_role_check;
ALTER TABLE players ADD CONSTRAINT players_pre_auction_role_check
  CHECK (pre_auction_role IS NULL OR pre_auction_role IN ('Captain', 'ViceCaptain', 'Squad'));

-- 3. Widen status to admit PreAuction
--    The live constraint name cannot be assumed (PostgREST/anon access hides
--    pg_catalog from the app, so it was never verified against the DB
--    directly). Look up every CHECK constraint that actually keys on the
--    "status" column and drop each by its real name, then add the widened
--    one. Scoping via pg_attribute avoids over-matching constraints whose
--    definition text merely contains the substring "status".
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT DISTINCT con.conname
    FROM pg_constraint con
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
    WHERE con.conrelid = 'players'::regclass
      AND con.contype = 'c'
      AND a.attname = 'status'
  LOOP
    EXECUTE format('ALTER TABLE players DROP CONSTRAINT %I', rec.conname);
  END LOOP;

  ALTER TABLE players ADD CONSTRAINT players_status_check
    CHECK (status IN ('Available', 'Sold', 'Unsold', 'PreAuction'));
END $$;

-- 4. At most one Captain and one Vice-Captain per team.
--    "At least one" and the three-Squad cap cannot be expressed as indexes;
--    they are enforced at upload time in src/utils/preAuctionRules.js.
CREATE UNIQUE INDEX IF NOT EXISTS one_captain_per_team
  ON players(sold_to) WHERE pre_auction_role = 'Captain';
CREATE UNIQUE INDEX IF NOT EXISTS one_vc_per_team
  ON players(sold_to) WHERE pre_auction_role = 'ViceCaptain';

-- 5. Default team budget for 2026
ALTER TABLE teams ALTER COLUMN max_tokens SET DEFAULT 1000;
ALTER TABLE teams ALTER COLUMN tokens_left SET DEFAULT 1000;

-- 6. sold_to holds a TEAM NAME, not a team id. The base schema declares it
--    VARCHAR(10), which is too narrow for "Fearless Falcons" and
--    "Quality Strikers" (16 chars each). sql/fix_column_lengths.sql widens it
--    to VARCHAR(50), but there is no way to confirm that was ever applied to
--    this database, and a narrow column would fail on the first real upload.
--    Widening is safe whether or not it has already happened.
ALTER TABLE players ALTER COLUMN sold_to TYPE VARCHAR(100);
ALTER TABLE players ALTER COLUMN status TYPE VARCHAR(20);
