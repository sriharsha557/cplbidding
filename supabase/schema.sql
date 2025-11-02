-- CPL Auction Database Schema

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(10) UNIQUE NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    logo_file VARCHAR(255),
    max_tokens INTEGER DEFAULT 1000,
    max_squad_size INTEGER DEFAULT 15,
    tokens_left INTEGER DEFAULT 1000,
    -- Category budgets
    batsman_budget_spent INTEGER DEFAULT 0,
    batsman_budget_remaining INTEGER DEFAULT 400,
    bowler_budget_spent INTEGER DEFAULT 0,
    bowler_budget_remaining INTEGER DEFAULT 400,
    allrounder_budget_spent INTEGER DEFAULT 0,
    allrounder_budget_remaining INTEGER DEFAULT 200,
    wicketkeeper_budget_spent INTEGER DEFAULT 0,
    wicketkeeper_budget_remaining INTEGER DEFAULT 150,
    -- Role counts
    batsman_count INTEGER DEFAULT 0,
    bowler_count INTEGER DEFAULT 0,
    allrounder_count INTEGER DEFAULT 0,
    wicketkeeper_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper')),
    department VARCHAR(100),
    base_tokens INTEGER NOT NULL,
    photo_filename VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available', 'Sold', 'Unsold')),
    sold_to VARCHAR(10) REFERENCES teams(team_id),
    sold_price INTEGER DEFAULT 0,
    auction_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction history table
CREATE TABLE IF NOT EXISTS auction_history (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(20) REFERENCES players(player_id),
    player_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    base_tokens INTEGER NOT NULL,
    sold_price INTEGER NOT NULL,
    team_id VARCHAR(10) REFERENCES teams(team_id),
    team_name VARCHAR(100) NOT NULL,
    tokens_left_after INTEGER,
    squad_size_after INTEGER,
    category_budget_remaining INTEGER,
    auction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction state table (for managing auction progress)
CREATE TABLE IF NOT EXISTS auction_state (
    id SERIAL PRIMARY KEY,
    current_player_index INTEGER DEFAULT 0,
    current_phase VARCHAR(20) DEFAULT 'Batsman' CHECK (current_phase IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper')),
    auction_started BOOLEAN DEFAULT FALSE,
    auction_completed BOOLEAN DEFAULT FALSE,
    total_players INTEGER DEFAULT 0,
    players_sold INTEGER DEFAULT 0,
    players_unsold INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default auction state
INSERT INTO auction_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_role ON players(role);
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_players_auction_order ON players(auction_order);
CREATE INDEX IF NOT EXISTS idx_auction_history_timestamp ON auction_history(auction_timestamp);

-- Row Level Security (RLS) policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_state ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on teams" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on auction_history" ON auction_history FOR ALL USING (true);
CREATE POLICY "Allow all operations on auction_state" ON auction_state FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auction_state_updated_at BEFORE UPDATE ON auction_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();