import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names
export const TABLES = {
  PLAYERS: 'players',
  TEAMS: 'teams',
  AUCTION_HISTORY: 'auction_history',
  AUCTION_STATE: 'auction_state'
}