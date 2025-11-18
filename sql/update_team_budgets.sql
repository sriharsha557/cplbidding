-- Update Team Budgets to Revised Structure
-- Run this in Supabase SQL Editor

-- Update all teams with new budget structure
UPDATE teams SET
  max_tokens = 1200,
  max_squad_size = 16,
  tokens_left = 1200,
  batsman_budget_remaining = 350,
  batsman_budget_spent = 0,
  bowler_budget_remaining = 300,
  bowler_budget_spent = 0,
  allrounder_budget_remaining = 350,
  allrounder_budget_spent = 0,
  wicketkeeper_budget_remaining = 200,
  wicketkeeper_budget_spent = 0,
  batsman_count = 0,
  bowler_count = 0,
  allrounder_count = 0,
  wicketkeeper_count = 0
WHERE team_id IS NOT NULL;

-- Verify the updates
SELECT 
  team_id,
  team_name,
  max_tokens,
  max_squad_size,
  tokens_left,
  batsman_budget_remaining,
  bowler_budget_remaining,
  allrounder_budget_remaining,
  wicketkeeper_budget_remaining
FROM teams
ORDER BY team_name;
