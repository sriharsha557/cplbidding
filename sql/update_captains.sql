-- Update Captain Assignments
-- Run this in Supabase SQL Editor

-- Add captain columns if not exists
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_captain BOOLEAN DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_vice_captain BOOLEAN DEFAULT FALSE;

-- Reset all players
UPDATE players SET is_captain = FALSE, is_vice_captain = FALSE;

-- Mark captains
UPDATE players SET is_captain = TRUE WHERE player_id = '14HB';  -- Mahethar Reddy Bhavanam (Team 1)
UPDATE players SET is_captain = TRUE WHERE player_id = 'MXL5';  -- Anil Mardani (Team 2)
UPDATE players SET is_captain = TRUE WHERE player_id = '3H3Y';  -- Surya Kiran Aravelli (Team 3)
UPDATE players SET is_captain = TRUE WHERE player_id = '2BJB';  -- Pradeep Kumar Pala (Team 4)
UPDATE players SET is_captain = TRUE WHERE player_id = '615R';  -- Siva Teja Pidikiti (Team 5)
UPDATE players SET is_captain = TRUE WHERE player_id = '628B';  -- Jagadish Babu Koppula Venkata (Team 6)
UPDATE players SET is_captain = TRUE WHERE player_id = '53JX';  -- Sairam Singh Balaji (Team 7)
UPDATE players SET is_captain = TRUE WHERE player_id = '7B8V';  -- Saravanan Krishnamoorthy (Team 8)

-- Mark vice-captains
UPDATE players SET is_vice_captain = TRUE WHERE player_id = '4V2H';
UPDATE players SET is_vice_captain = TRUE WHERE player_id = '4FF3';
UPDATE players SET is_vice_captain = TRUE WHERE player_id = '5CLA';
UPDATE players SET is_vice_captain = TRUE WHERE player_id = '5K5T';
UPDATE players SET is_vice_captain = TRUE WHERE player_id = '44QM';
UPDATE players SET is_vice_captain = TRUE WHERE player_id = '6RMT';
UPDATE players SET is_vice_captain = TRUE WHERE player_id = '6NN4';
UPDATE players SET is_vice_captain = TRUE WHERE player_id = '646D';

-- Assign captains and vice-captains to teams (pre-sold, excluded from auction)
UPDATE players SET status = 'Sold', sold_to = 'Team 1', sold_price = 45 WHERE player_id = '14HB';  -- Captain: Mahethar
UPDATE players SET status = 'Sold', sold_to = 'Team 1', sold_price = 50 WHERE player_id = '4V2H';  -- Vice-Captain: Debargha
UPDATE players SET status = 'Sold', sold_to = 'Team 2', sold_price = 45 WHERE player_id = 'MXL5';  -- Captain: Anil
UPDATE players SET status = 'Sold', sold_to = 'Team 2', sold_price = 45 WHERE player_id = '4FF3';  -- Vice-Captain: Dinesh
UPDATE players SET status = 'Sold', sold_to = 'Team 3', sold_price = 50 WHERE player_id = '3H3Y';
UPDATE players SET status = 'Sold', sold_to = 'Team 3', sold_price = 50 WHERE player_id = '5CLA';
UPDATE players SET status = 'Sold', sold_to = 'Team 4', sold_price = 50 WHERE player_id = '2BJB';
UPDATE players SET status = 'Sold', sold_to = 'Team 4', sold_price = 50 WHERE player_id = '5K5T';
UPDATE players SET status = 'Sold', sold_to = 'Team 5', sold_price = 50 WHERE player_id = '615R';
UPDATE players SET status = 'Sold', sold_to = 'Team 5', sold_price = 50 WHERE player_id = '44QM';
UPDATE players SET status = 'Sold', sold_to = 'Team 6', sold_price = 50 WHERE player_id = '628B';
UPDATE players SET status = 'Sold', sold_to = 'Team 6', sold_price = 50 WHERE player_id = '6RMT';
UPDATE players SET status = 'Sold', sold_to = 'Team 7', sold_price = 45 WHERE player_id = '53JX';
UPDATE players SET status = 'Sold', sold_to = 'Team 7', sold_price = 50 WHERE player_id = '6NN4';
UPDATE players SET status = 'Sold', sold_to = 'Team 8', sold_price = 50 WHERE player_id = '7B8V';
UPDATE players SET status = 'Sold', sold_to = 'Team 8', sold_price = 50 WHERE player_id = '646D';

-- Verify captain assignments
SELECT player_id, name, role, is_captain, is_vice_captain, status, sold_to, sold_price FROM players WHERE is_captain = TRUE OR is_vice_captain = TRUE ORDER BY sold_to, is_captain DESC;
