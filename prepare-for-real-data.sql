-- =====================================================
-- PREPARE SUPABASE FOR REAL CPL DATA
-- =====================================================
-- This script clears sample data and prepares for actual player/team data

-- Step 1: Backup existing data (OPTIONAL - run if you want to keep sample data)
-- =====================================================
/*
CREATE TABLE teams_sample_backup AS SELECT * FROM teams;
CREATE TABLE players_sample_backup AS SELECT * FROM players;
CREATE TABLE auction_history_sample_backup AS SELECT * FROM auction_history;
*/

-- Step 2: Clear all sample/test data
-- =====================================================
-- Clear in correct order due to foreign key constraints

-- Clear auction history first
DELETE FROM auction_history;
PRINT 'Cleared auction history';

-- Clear all players
DELETE FROM players;
PRINT 'Cleared all players';

-- Clear all teams  
DELETE FROM teams;
PRINT 'Cleared all teams';

-- Step 3: Reset sequences (optional - for clean IDs)
-- =====================================================
ALTER SEQUENCE teams_id_seq RESTART WITH 1;
ALTER SEQUENCE players_id_seq RESTART WITH 1;
ALTER SEQUENCE auction_history_id_seq RESTART WITH 1;

-- Step 4: Verify cleanup
-- =====================================================
SELECT 
  'teams' as table_name, 
  COUNT(*) as remaining_records 
FROM teams
UNION ALL
SELECT 
  'players' as table_name, 
  COUNT(*) as remaining_records 
FROM players
UNION ALL
SELECT 
  'auction_history' as table_name, 
  COUNT(*) as remaining_records 
FROM auction_history;

-- Expected result: All counts should be 0

-- =====================================================
-- READY FOR YOUR REAL DATA!
-- =====================================================
-- Now you can insert your actual CPL teams and players
-- 
-- Example format for teams:
-- INSERT INTO teams (team_id, team_name, logo_file, tokens_left, max_tokens, max_squad_size, batsman_budget, bowler_budget, allrounder_budget, wicketkeeper_budget) VALUES
-- ('REAL_T001', 'Your Team Name', 'team_logo.png', 1200, 1200, 15, 420, 420, 240, 120);
--
-- Example format for players:
-- INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES
-- ('REAL_P001', 'Player Name', 'Batsman', 45, 'player_photo.jpg', 'Batting', 'Available');
--
-- Remember to use the optimized base token ranges:
-- - Batsmen: 15-70 tokens (based on performance tier)
-- - Bowlers: 12-65 tokens (based on performance tier)  
-- - All-rounders: 20-80 tokens (based on performance tier)
-- - WicketKeepers: 12-60 tokens (based on performance tier)
-- =====================================================