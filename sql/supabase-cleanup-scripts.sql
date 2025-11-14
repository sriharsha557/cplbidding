-- =====================================================
-- CPL Auction Supabase Data Cleanup Scripts
-- =====================================================

-- 1. CLEAR ALL SAMPLE DATA (Complete Reset)
-- =====================================================
-- Use this to remove all sample/test data and start fresh

-- Clear auction history first (due to foreign key constraints)
DELETE FROM auction_history;

-- Clear all players
DELETE FROM players;

-- Clear all teams
DELETE FROM teams;

-- Reset auto-increment sequences (optional)
ALTER SEQUENCE teams_id_seq RESTART WITH 1;
ALTER SEQUENCE players_id_seq RESTART WITH 1;
ALTER SEQUENCE auction_history_id_seq RESTART WITH 1;

-- =====================================================
-- 2. RESET AUCTION ONLY (Keep Players & Teams)
-- =====================================================
-- Use this to reset auction progress but keep player/team data

-- Clear auction history
DELETE FROM auction_history;

-- Reset all players to 'Available' status
UPDATE players SET 
  status = 'Available',
  sold_to = NULL,
  sold_price = NULL;

-- Reset all team budgets and squads
UPDATE teams SET 
  tokens_left = max_tokens,
  batsman_budget = 420,
  bowler_budget = 420,
  allrounder_budget = 240,
  wicketkeeper_budget = 120;

-- =====================================================
-- 3. VERIFY DATA CLEANUP
-- =====================================================
-- Run these queries to check what data remains

-- Check teams count
SELECT 'Teams' as table_name, COUNT(*) as record_count FROM teams
UNION ALL
-- Check players count  
SELECT 'Players' as table_name, COUNT(*) as record_count FROM players
UNION ALL
-- Check auction history count
SELECT 'Auction History' as table_name, COUNT(*) as record_count FROM auction_history;

-- Check player status distribution
SELECT status, COUNT(*) as count 
FROM players 
GROUP BY status;

-- Check team budget status
SELECT 
  team_name,
  tokens_left,
  batsman_budget,
  bowler_budget,
  allrounder_budget,
  wicketkeeper_budget
FROM teams;

-- =====================================================
-- 4. SAMPLE DATA INSERTION (For Testing)
-- =====================================================
-- Use this section to insert sample data for testing

-- Insert sample teams
INSERT INTO teams (team_id, team_name, logo_file, tokens_left, max_tokens, max_squad_size, batsman_budget, bowler_budget, allrounder_budget, wicketkeeper_budget) VALUES
('T001', 'Mumbai Warriors', 'mumbai_logo.png', 1200, 1200, 15, 420, 420, 240, 120),
('T002', 'Delhi Capitals', 'delhi_logo.png', 1200, 1200, 15, 420, 420, 240, 120),
('T003', 'Chennai Super Kings', 'chennai_logo.png', 1200, 1200, 15, 420, 420, 240, 120),
('T004', 'Kolkata Knight Riders', 'kolkata_logo.png', 1200, 1200, 15, 420, 420, 240, 120);

-- Insert sample players
INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES
-- Batsmen
('P001', 'Virat Kohli', 'Batsman', 65, 'virat.jpg', 'Batting', 'Available'),
('P002', 'Rohit Sharma', 'Batsman', 60, 'rohit.jpg', 'Batting', 'Available'),
('P003', 'KL Rahul', 'Batsman', 55, 'rahul.jpg', 'Batting', 'Available'),
('P004', 'Shikhar Dhawan', 'Batsman', 45, 'dhawan.jpg', 'Batting', 'Available'),

-- Bowlers  
('P005', 'Jasprit Bumrah', 'Bowler', 70, 'bumrah.jpg', 'Bowling', 'Available'),
('P006', 'Rashid Khan', 'Bowler', 65, 'rashid.jpg', 'Bowling', 'Available'),
('P007', 'Yuzvendra Chahal', 'Bowler', 50, 'chahal.jpg', 'Bowling', 'Available'),
('P008', 'Mohammed Shami', 'Bowler', 45, 'shami.jpg', 'Bowling', 'Available'),

-- All-rounders
('P009', 'Hardik Pandya', 'All-rounder', 75, 'hardik.jpg', 'All-rounder', 'Available'),
('P010', 'Andre Russell', 'All-rounder', 70, 'russell.jpg', 'All-rounder', 'Available'),
('P011', 'Ravindra Jadeja', 'All-rounder', 65, 'jadeja.jpg', 'All-rounder', 'Available'),

-- Wicketkeepers
('P012', 'MS Dhoni', 'WicketKeeper', 55, 'dhoni.jpg', 'Wicket Keeping', 'Available'),
('P013', 'Rishabh Pant', 'WicketKeeper', 50, 'pant.jpg', 'Wicket Keeping', 'Available'),
('P014', 'Dinesh Karthik', 'WicketKeeper', 35, 'karthik.jpg', 'Wicket Keeping', 'Available');

-- =====================================================
-- 5. DATA VALIDATION QUERIES
-- =====================================================
-- Use these to validate your data after insertion

-- Check for duplicate player IDs
SELECT player_id, COUNT(*) 
FROM players 
GROUP BY player_id 
HAVING COUNT(*) > 1;

-- Check for duplicate team IDs
SELECT team_id, COUNT(*) 
FROM teams 
GROUP BY team_id 
HAVING COUNT(*) > 1;

-- Validate role values
SELECT DISTINCT role 
FROM players 
WHERE role NOT IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper');

-- Check base token ranges by role
SELECT 
  role,
  MIN(base_tokens) as min_tokens,
  MAX(base_tokens) as max_tokens,
  AVG(base_tokens) as avg_tokens,
  COUNT(*) as player_count
FROM players 
GROUP BY role;

-- =====================================================
-- 6. BACKUP QUERIES (Run before cleanup)
-- =====================================================
-- Use these to backup your data before cleanup

-- Backup teams
CREATE TABLE teams_backup AS SELECT * FROM teams;

-- Backup players  
CREATE TABLE players_backup AS SELECT * FROM players;

-- Backup auction history
CREATE TABLE auction_history_backup AS SELECT * FROM auction_history;

-- =====================================================
-- 7. RESTORE FROM BACKUP (If needed)
-- =====================================================
-- Use these to restore data from backup tables

-- Restore teams
-- DELETE FROM teams;
-- INSERT INTO teams SELECT * FROM teams_backup;

-- Restore players
-- DELETE FROM players;  
-- INSERT INTO players SELECT * FROM players_backup;

-- Restore auction history
-- DELETE FROM auction_history;
-- INSERT INTO auction_history SELECT * FROM auction_history_backup;

-- =====================================================
-- 8. DROP BACKUP TABLES (After successful restore)
-- =====================================================
-- Clean up backup tables when no longer needed

-- DROP TABLE IF EXISTS teams_backup;
-- DROP TABLE IF EXISTS players_backup;
-- DROP TABLE IF EXISTS auction_history_backup;

-- =====================================================
-- USAGE INSTRUCTIONS:
-- =====================================================
-- 
-- 1. To completely clear all data:
--    Run section 1 (CLEAR ALL SAMPLE DATA)
--
-- 2. To reset auction but keep players/teams:
--    Run section 2 (RESET AUCTION ONLY)
--
-- 3. To add sample data for testing:
--    Run section 4 (SAMPLE DATA INSERTION)
--
-- 4. To validate your data:
--    Run section 5 (DATA VALIDATION QUERIES)
--
-- 5. To backup before cleanup:
--    Run section 6 (BACKUP QUERIES)
--
-- Always run verification queries after any cleanup!
-- =====================================================