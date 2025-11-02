-- CPL Auction Database Schema
-- Simple tables that mirror your Excel structure

-- Teams table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  team_id TEXT UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  logo_file TEXT,
  tokens_left INTEGER DEFAULT 1000,
  max_tokens INTEGER DEFAULT 1000,
  max_squad_size INTEGER DEFAULT 15,
  -- Category budgets
  batsman_budget INTEGER DEFAULT 400,
  bowler_budget INTEGER DEFAULT 400,
  allrounder_budget INTEGER DEFAULT 200,
  wicketkeeper_budget INTEGER DEFAULT 150,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  player_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper')),
  base_tokens INTEGER NOT NULL,
  photo_filename TEXT,
  department TEXT,
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Sold', 'Unsold')),
  sold_to TEXT REFERENCES teams(team_name),
  sold_price INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auction history (optional - for tracking)
CREATE TABLE auction_history (
  id SERIAL PRIMARY KEY,
  player_id TEXT REFERENCES players(player_id),
  team_name TEXT REFERENCES teams(team_name),
  sold_price INTEGER,
  auction_date TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (optional)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Allow all operations on teams" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on auction_history" ON auction_history FOR ALL USING (true);

-- Indexes for better performance
CREATE INDEX idx_players_role ON players(role);
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_teams_name ON teams(team_name);