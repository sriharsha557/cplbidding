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
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_status_check;
ALTER TABLE players ADD CONSTRAINT players_status_check
  CHECK (status IN ('Available', 'Sold', 'Unsold', 'PreAuction'));

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
