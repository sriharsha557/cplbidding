-- =====================================================
-- INSERT YOUR REAL CPL DATA
-- =====================================================
-- Use this template to insert your actual teams and players

-- =====================================================
-- 1. INSERT YOUR REAL TEAMS
-- =====================================================
-- Replace with your actual team data

INSERT INTO teams (team_id, team_name, logo_file, tokens_left, max_tokens, max_squad_size, batsman_budget, bowler_budget, allrounder_budget, wicketkeeper_budget) VALUES
-- Example teams - replace with your actual teams
('CPL_T001', 'Team Alpha', 'alpha_logo.png', 1200, 1200, 15, 420, 420, 240, 120),
('CPL_T002', 'Team Beta', 'beta_logo.png', 1200, 1200, 15, 420, 420, 240, 120),
('CPL_T003', 'Team Gamma', 'gamma_logo.png', 1200, 1200, 15, 420, 420, 240, 120),
('CPL_T004', 'Team Delta', 'delta_logo.png', 1200, 1200, 15, 420, 420, 240, 120);
-- Add more teams as needed

-- =====================================================
-- 2. INSERT YOUR REAL PLAYERS
-- =====================================================
-- Replace with your actual player data
-- Use the Player Valuation Framework to set appropriate base_tokens

-- BATSMEN (Recommended base tokens: 15-70)
INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES
-- Star Batsmen (50-70 tokens)
('CPL_P001', 'Your Star Batsman 1', 'Batsman', 65, 'batsman1.jpg', 'Batting', 'Available'),
('CPL_P002', 'Your Star Batsman 2', 'Batsman', 60, 'batsman2.jpg', 'Batting', 'Available'),

-- Good Batsmen (30-49 tokens)  
('CPL_P003', 'Your Good Batsman 1', 'Batsman', 45, 'batsman3.jpg', 'Batting', 'Available'),
('CPL_P004', 'Your Good Batsman 2', 'Batsman', 40, 'batsman4.jpg', 'Batting', 'Available'),

-- Average Batsmen (15-29 tokens)
('CPL_P005', 'Your Average Batsman 1', 'Batsman', 25, 'batsman5.jpg', 'Batting', 'Available'),
('CPL_P006', 'Your Average Batsman 2', 'Batsman', 20, 'batsman6.jpg', 'Batting', 'Available');

-- BOWLERS (Recommended base tokens: 12-65)
INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES
-- Star Bowlers (45-65 tokens)
('CPL_P007', 'Your Star Bowler 1', 'Bowler', 60, 'bowler1.jpg', 'Bowling', 'Available'),
('CPL_P008', 'Your Star Bowler 2', 'Bowler', 55, 'bowler2.jpg', 'Bowling', 'Available'),

-- Good Bowlers (25-44 tokens)
('CPL_P009', 'Your Good Bowler 1', 'Bowler', 40, 'bowler3.jpg', 'Bowling', 'Available'),
('CPL_P010', 'Your Good Bowler 2', 'Bowler', 35, 'bowler4.jpg', 'Bowling', 'Available'),

-- Average Bowlers (12-24 tokens)
('CPL_P011', 'Your Average Bowler 1', 'Bowler', 20, 'bowler5.jpg', 'Bowling', 'Available'),
('CPL_P012', 'Your Average Bowler 2', 'Bowler', 15, 'bowler6.jpg', 'Bowling', 'Available');

-- ALL-ROUNDERS (Recommended base tokens: 20-80)
INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES
-- Premium All-rounders (60-80 tokens)
('CPL_P013', 'Your Premium All-rounder 1', 'All-rounder', 75, 'allrounder1.jpg', 'All-rounder', 'Available'),
('CPL_P014', 'Your Premium All-rounder 2', 'All-rounder', 70, 'allrounder2.jpg', 'All-rounder', 'Available'),

-- Good All-rounders (35-59 tokens)
('CPL_P015', 'Your Good All-rounder 1', 'All-rounder', 50, 'allrounder3.jpg', 'All-rounder', 'Available'),
('CPL_P016', 'Your Good All-rounder 2', 'All-rounder', 45, 'allrounder4.jpg', 'All-rounder', 'Available'),

-- Average All-rounders (20-34 tokens)
('CPL_P017', 'Your Average All-rounder 1', 'All-rounder', 30, 'allrounder5.jpg', 'All-rounder', 'Available'),
('CPL_P018', 'Your Average All-rounder 2', 'All-rounder', 25, 'allrounder6.jpg', 'All-rounder', 'Available');

-- WICKETKEEPERS (Recommended base tokens: 12-60)
INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES
-- Premium Keepers (40-60 tokens)
('CPL_P019', 'Your Premium Keeper 1', 'WicketKeeper', 55, 'keeper1.jpg', 'Wicket Keeping', 'Available'),
('CPL_P020', 'Your Premium Keeper 2', 'WicketKeeper', 50, 'keeper2.jpg', 'Wicket Keeping', 'Available'),

-- Good Keepers (22-39 tokens)
('CPL_P021', 'Your Good Keeper 1', 'WicketKeeper', 35, 'keeper3.jpg', 'Wicket Keeping', 'Available'),
('CPL_P022', 'Your Good Keeper 2', 'WicketKeeper', 30, 'keeper4.jpg', 'Wicket Keeping', 'Available'),

-- Average Keepers (12-21 tokens)
('CPL_P023', 'Your Average Keeper 1', 'WicketKeeper', 18, 'keeper5.jpg', 'Wicket Keeping', 'Available'),
('CPL_P024', 'Your Average Keeper 2', 'WicketKeeper', 15, 'keeper6.jpg', 'Wicket Keeping', 'Available');

-- =====================================================
-- 3. VERIFY YOUR DATA
-- =====================================================
-- Run these queries to check your inserted data

-- Check team count
SELECT COUNT(*) as team_count FROM teams;

-- Check player count by role
SELECT role, COUNT(*) as player_count 
FROM players 
GROUP BY role 
ORDER BY role;

-- Check base token distribution
SELECT 
  role,
  MIN(base_tokens) as min_tokens,
  MAX(base_tokens) as max_tokens,
  AVG(base_tokens) as avg_tokens,
  COUNT(*) as player_count
FROM players 
GROUP BY role;

-- Check for any data issues
SELECT 
  'Duplicate Player IDs' as check_type,
  COUNT(*) as issue_count
FROM (
  SELECT player_id 
  FROM players 
  GROUP BY player_id 
  HAVING COUNT(*) > 1
) duplicates
UNION ALL
SELECT 
  'Invalid Roles' as check_type,
  COUNT(*) as issue_count
FROM players 
WHERE role NOT IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper');

-- =====================================================
-- CUSTOMIZATION NOTES:
-- =====================================================
-- 
-- 1. Replace all example names with your actual player names
-- 2. Update player_id values to match your naming convention
-- 3. Set appropriate base_tokens using the Player Valuation Framework
-- 4. Update photo_filename to match your actual image files
-- 5. Adjust team names and logos to match your tournament
-- 6. Add more players/teams as needed for your tournament size
--
-- Base Token Guidelines:
-- - Use the Player Valuation Calculator for accurate pricing
-- - Consider player performance, experience, and market demand
-- - Ensure balanced distribution across all categories
-- - Test with a few players first, then add the rest
-- =====================================================