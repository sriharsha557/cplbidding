import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

class SupabaseAuctionService {

  // Load data from Supabase (same format as Excel service)
  async loadData() {
    try {
      // Load teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*');

      if (teamsError) throw teamsError;

      // Load players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*');

      if (playersError) throw playersError;

      // Convert to same format as Excel service
      const teams = {};
      teamsData.forEach(team => {
        teams[team.team_name] = {
          id: team.team_id,
          logo: team.logo_file,
          tokensLeft: team.tokens_left,
          squad: [],
          maxTokens: team.max_tokens,
          maxSquadSize: team.max_squad_size,
          roleCount: {
            'Batsman': 0,
            'Bowler': 0,
            'WicketKeeper': 0,
            'All-rounder': 0
          },
          categoryBudgets: {
            'Batsman': { spent: team.batsman_budget_spent || 0, remaining: team.batsman_budget_remaining || 400, min: 300, max: 400, minPlayers: 4, maxPlayers: 5 },
            'Bowler': { spent: team.bowler_budget_spent || 0, remaining: team.bowler_budget_remaining || 400, min: 300, max: 400, minPlayers: 4, maxPlayers: 5 },
            'All-rounder': { spent: team.allrounder_budget_spent || 0, remaining: team.allrounder_budget_remaining || 200, min: 150, max: 200, minPlayers: 3, maxPlayers: 4 },
            'WicketKeeper': { spent: team.wicketkeeper_budget_spent || 0, remaining: team.wicketkeeper_budget_remaining || 150, min: 100, max: 150, minPlayers: 2, maxPlayers: 3 }
          }
        };
      });

      // Convert players to same format
      const players = playersData.map(player => ({
        PlayerID: player.player_id,
        Name: player.name,
        Role: player.role,
        BaseTokens: player.base_tokens,
        PhotoFileName: player.photo_filename,
        Department: player.department,
        Status: player.status,
        SoldTo: player.sold_to,
        SoldPrice: player.sold_price
      }));

      return { players, teams };

    } catch (error) {
      console.error('Error loading from Supabase:', error);
      throw error;
    }
  }

  // Update player when sold
  async sellPlayer(playerId, teamName, bidPrice, playerRole) {
    try {
      console.log('Selling player:', { playerId, teamName, bidPrice, playerRole });
      
      // Update player
      const { error: playerError } = await supabase
        .from('players')
        .update({
          status: 'Sold',
          sold_to: teamName,
          sold_price: bidPrice
        })
        .eq('player_id', playerId);

      if (playerError) {
        console.error('Player update error:', playerError);
        throw playerError;
      }
      console.log('Player updated successfully');

      // Update team budget
      const roleKey = playerRole.toLowerCase().replace('-', '');
      const budgetSpentField = `${roleKey}_budget_spent`;
      const budgetRemainingField = `${roleKey}_budget_remaining`;
      const countField = `${roleKey}_count`;
      
      console.log('Fetching team data:', { teamName, roleKey, budgetSpentField });
      
      const { data: team, error: teamFetchError } = await supabase
        .from('teams')
        .select(`tokens_left, ${budgetSpentField}, ${budgetRemainingField}, ${countField}`)
        .eq('team_name', teamName)
        .single();

      if (teamFetchError) {
        console.error('Team fetch error:', teamFetchError);
        throw teamFetchError;
      }

      console.log('Team data fetched:', team);

      if (team) {
        const { error: teamError } = await supabase
          .from('teams')
          .update({
            tokens_left: team.tokens_left - bidPrice,
            [budgetSpentField]: (team[budgetSpentField] || 0) + bidPrice,
            [budgetRemainingField]: (team[budgetRemainingField] || 0) - bidPrice,
            [countField]: (team[countField] || 0) + 1
          })
          .eq('team_name', teamName);

        if (teamError) {
          console.error('Team update error:', teamError);
          throw teamError;
        }
        console.log('Team updated successfully');
      }

      return { success: true };

    } catch (error) {
      console.error('Error selling player:', error);
      throw error;
    }
  }

  // Mark player as unsold
  async markUnsold(playerId) {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          status: 'Unsold',
          sold_to: null,
          sold_price: null
        })
        .eq('player_id', playerId);

      if (error) throw error;
      return { success: true };

    } catch (error) {
      console.error('Error marking unsold:', error);
      throw error;
    }
  }

  // Upload Excel data to Supabase (clear and insert)
  async uploadExcelData(players, teams) {
    try {
      console.log('Uploading Excel data to Supabase:', { 
        playersCount: players.length, 
        teamsCount: teams.length 
      });

      // Clear existing data (optional - remove if you want to keep existing data)
      await supabase.from('players').delete().neq('id', 0);
      await supabase.from('teams').delete().neq('id', 0);

      // Insert teams
      const { error: teamsError } = await supabase
        .from('teams')
        .insert(teams.map(team => ({
          team_id: team.TeamID,
          team_name: team.TeamName,
          logo_file: team.LogoFile || null,
          max_tokens: 1000,
          max_squad_size: 15,
          tokens_left: 1000,
          batsman_budget_remaining: 400,
          bowler_budget_remaining: 400,
          allrounder_budget_remaining: 200,
          wicketkeeper_budget_remaining: 150
        })));

      if (teamsError) {
        console.error('Teams insert error:', teamsError);
        throw teamsError;
      }

      // Insert players
      const { error: playersError } = await supabase
        .from('players')
        .insert(players.map((player, index) => ({
          player_id: player.PlayerID,
          name: player.Name,
          role: player.Role,
          base_tokens: player.BaseTokens,
          photo_filename: player.PhotoFileName || null,
          department: player.Department || null,
          auction_order: index + 1,
          status: 'Available'
        })));

      if (playersError) {
        console.error('Players insert error:', playersError);
        throw playersError;
      }

      return {
        success: true,
        message: `Successfully uploaded ${players.length} players and ${teams.length} teams`
      };

    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Merge Excel data into Supabase (upsert operation)
  async mergeExcelData(players, teams) {
    try {
      console.log('Merging Excel data into Supabase:', { 
        playersCount: players.length, 
        teamsCount: teams.length 
      });

      // 1. Upsert teams (insert or update)
      const { error: teamsError } = await supabase
        .from('teams')
        .upsert(teams.map(team => ({
          team_id: team.TeamID,
          team_name: team.TeamName,
          logo_file: team.LogoFile || null,
          max_tokens: 1000,
          max_squad_size: 15,
          // Only set initial values if not already set
          tokens_left: 1000,
          batsman_budget_remaining: 400,
          bowler_budget_remaining: 400,
          allrounder_budget_remaining: 200,
          wicketkeeper_budget_remaining: 150
        })), {
          onConflict: 'team_id',
          ignoreDuplicates: false
        });

      if (teamsError) {
        console.error('Teams upsert error:', teamsError);
        throw teamsError;
      }

      // 2. Upsert players (insert or update)
      const { error: playersError } = await supabase
        .from('players')
        .upsert(players.map((player, index) => ({
          player_id: player.PlayerID,
          name: player.Name,
          role: player.Role,
          base_tokens: player.BaseTokens,
          photo_filename: player.PhotoFileName || null,
          department: player.Department || null,
          auction_order: index + 1,
          // Only set status if not already set (preserve existing auction data)
          status: 'Available'
        })), {
          onConflict: 'player_id',
          ignoreDuplicates: false
        });

      if (playersError) {
        console.error('Players upsert error:', playersError);
        throw playersError;
      }

      return {
        success: true,
        playersProcessed: players.length,
        teamsProcessed: teams.length,
        message: `Successfully merged ${players.length} players and ${teams.length} teams`
      };

    } catch (error) {
      console.error('Error merging Excel data into Supabase:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Reset/Clear all auction data
  async resetAuctionData() {
    try {
      console.log('Resetting all auction data...');

      // 1. Clear auction history
      const { error: historyError } = await supabase
        .from('auction_history')
        .delete()
        .neq('id', 0);

      if (historyError) throw historyError;

      // 2. Reset all players to Available status
      const { error: playersError } = await supabase
        .from('players')
        .update({
          status: 'Available',
          sold_to: null,
          sold_price: 0
        })
        .neq('id', 0);

      if (playersError) throw playersError;

      // 3. Reset all team budgets and counts
      const { error: teamsError } = await supabase
        .from('teams')
        .update({
          tokens_left: 1000,
          batsman_budget_spent: 0,
          batsman_budget_remaining: 400,
          bowler_budget_spent: 0,
          bowler_budget_remaining: 400,
          allrounder_budget_spent: 0,
          allrounder_budget_remaining: 200,
          wicketkeeper_budget_spent: 0,
          wicketkeeper_budget_remaining: 150,
          batsman_count: 0,
          bowler_count: 0,
          allrounder_count: 0,
          wicketkeeper_count: 0
        })
        .neq('id', 0);

      if (teamsError) throw teamsError;

      // 4. Reset auction state
      const { error: stateError } = await supabase
        .from('auction_state')
        .update({
          current_player_index: 0,
          current_phase: 'Batsman',
          auction_started: false,
          auction_completed: false,
          players_sold: 0,
          players_unsold: 0
        })
        .eq('id', 1);

      if (stateError) throw stateError;

      return {
        success: true,
        message: 'All auction data has been reset successfully'
      };

    } catch (error) {
      console.error('Error resetting auction data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clear all data (players and teams) - for complete cleanup
  async clearAllData() {
    try {
      console.log('Clearing all data from database...');

      // Clear in order due to foreign key constraints
      await supabase.from('auction_history').delete().neq('id', 0);
      await supabase.from('players').delete().neq('id', 0);
      await supabase.from('teams').delete().neq('id', 0);

      // Reset auction state
      await supabase
        .from('auction_state')
        .update({
          current_player_index: 0,
          current_phase: 'Batsman',
          auction_started: false,
          auction_completed: false,
          total_players: 0,
          players_sold: 0,
          players_unsold: 0
        })
        .eq('id', 1);

      return {
        success: true,
        message: 'All data cleared from database'
      };

    } catch (error) {
      console.error('Error clearing all data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const supabaseAuctionService = new SupabaseAuctionService();