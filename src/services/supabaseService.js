import { createClient } from '@supabase/supabase-js';
import { CPL_2026 } from '../config/cpl2026';
import { splitOutPreAuctionPlayers } from '../utils/preAuctionGuard';

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

      // Convert players first so squads can be populated from them.
      const players = playersData.map(player => ({
        PlayerID: player.player_id,
        Name: player.name,
        Role: player.role,
        BaseTokens: player.base_tokens,
        PhotoFileName: player.photo_filename,
        Department: player.department,
        Status: player.status,
        SoldTo: player.sold_to,
        SoldPrice: player.sold_price,
        Availability: player.availability || 'Unknown',
        PreAuctionRole: player.pre_auction_role || null,
        IsCaptain: player.is_captain || false,
        IsViceCaptain: player.is_vice_captain || false
      }));

      const teams = {};
      teamsData.forEach(team => {
        teams[team.team_name] = {
          id: team.team_id,
          logo: team.logo_file,
          tokensLeft: team.tokens_left,
          squad: [],
          maxTokens: team.max_tokens,
          maxSquadSize: team.max_squad_size,
          preAuctionSubmitted: team.pre_auction_submitted || false,
          preAuctionSubmittedAt: team.pre_auction_submitted_at || null,
          roleCount: {
            'Batsman': 0,
            'Bowler': 0,
            'WicketKeeper': 0,
            'All-rounder': 0
          },
          categoryBudgets: {
            'Batsman': { spent: team.batsman_budget_spent || 0, remaining: team.batsman_budget_remaining || 0, max: CPL_2026.advisoryCategorySpend['Batsman'] },
            'Bowler': { spent: team.bowler_budget_spent || 0, remaining: team.bowler_budget_remaining || 0, max: CPL_2026.advisoryCategorySpend['Bowler'] },
            'All-rounder': { spent: team.allrounder_budget_spent || 0, remaining: team.allrounder_budget_remaining || 0, max: CPL_2026.advisoryCategorySpend['All-rounder'] },
            'WicketKeeper': { spent: team.wicketkeeper_budget_spent || 0, remaining: team.wicketkeeper_budget_remaining || 0, max: CPL_2026.advisoryCategorySpend['WicketKeeper'] }
          }
        };
      });

      // Populate each team's squad from the players table. Without this, squads
      // are empty on every page load and pre-auction players never appear.
      players.forEach(player => {
        const isOnATeam = player.Status === 'Sold' || player.Status === 'PreAuction';
        if (!isOnATeam || !player.SoldTo) return;

        const team = teams[player.SoldTo];
        if (!team) return;

        team.squad.push({ ...player, BidPrice: player.SoldPrice || 0 });
        if (team.roleCount[player.Role] !== undefined) {
          team.roleCount[player.Role] += 1;
        }
      });

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

  /** player_id values currently locked into a team's pre-auction five. */
  async getPreAuctionPlayerIds() {
    const { data, error } = await supabase
      .from('players')
      .select('player_id')
      .eq('status', 'PreAuction');

    if (error) throw error;
    return (data || []).map(row => row.player_id);
  }

  // Upload Excel data to Supabase (clear and insert)
  async uploadExcelData(players, teams) {
    try {
      console.log('Uploading Excel data to Supabase:', {
        playersCount: players.length,
        teamsCount: teams.length
      });

      // Never delete players locked into a team's pre-auction five, and never
      // delete the teams they belong to.
      const lockedIds = await this.getPreAuctionPlayerIds();

      if (lockedIds.length > 0) {
        await supabase.from('players').delete().or('status.is.null,status.neq.PreAuction');
      } else {
        await supabase.from('players').delete().neq('id', 0);
        await supabase.from('teams').delete().neq('id', 0);
      }

      // Upsert, not insert: teams survive when pre-auction squads are loaded.
      const { error: teamsError } = await supabase
        .from('teams')
        .upsert(teams.map(team => ({
          team_id: team.TeamID,
          team_name: team.TeamName,
          logo_file: team.LogoFile || null,
          max_tokens: CPL_2026.auctionBudget,
          max_squad_size: CPL_2026.defaultSquadSize,
          tokens_left: CPL_2026.auctionBudget,
          batsman_budget_remaining: CPL_2026.advisoryCategorySpend['Batsman'],
          bowler_budget_remaining: CPL_2026.advisoryCategorySpend['Bowler'],
          allrounder_budget_remaining: CPL_2026.advisoryCategorySpend['All-rounder'],
          wicketkeeper_budget_remaining: CPL_2026.advisoryCategorySpend['WicketKeeper']
        })), { onConflict: 'team_id', ignoreDuplicates: false });

      if (teamsError) {
        console.error('Teams insert error:', teamsError);
        throw teamsError;
      }

      // Insert players, holding back anyone already locked in pre-auction.
      const { safeToWrite, skipped } = splitOutPreAuctionPlayers(players, lockedIds);
      if (skipped.length > 0) {
        console.log(`Skipped ${skipped.length} pre-auction players:`, skipped);
      }

      const { error: playersError } = await supabase
        .from('players')
        .insert(safeToWrite.map((player, index) => ({
          player_id: player.PlayerID,
          name: player.Name,
          role: player.Role,
          base_tokens: player.BaseTokens,
          photo_filename: player.PhotoFileName || null,
          department: player.Department || null,
          auction_order: index + 1,
          status: player.Status || 'Available',
          sold_to: player.SoldTo || null,
          sold_price: player.SoldPrice || 0,
          is_captain: player.IsCaptain || false,
          is_vice_captain: player.IsViceCaptain || false
        })));

      if (playersError) {
        console.error('Players insert error:', playersError);
        throw playersError;
      }

      return {
        success: true,
        message: skipped.length > 0
          ? `Uploaded ${safeToWrite.length} players and ${teams.length} teams (${skipped.length} pre-auction players preserved)`
          : `Successfully uploaded ${players.length} players and ${teams.length} teams`
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
          max_tokens: CPL_2026.auctionBudget,
          max_squad_size: CPL_2026.defaultSquadSize,
          // Only set initial values if not already set
          tokens_left: CPL_2026.auctionBudget,
          batsman_budget_remaining: CPL_2026.advisoryCategorySpend['Batsman'],
          bowler_budget_remaining: CPL_2026.advisoryCategorySpend['Bowler'],
          allrounder_budget_remaining: CPL_2026.advisoryCategorySpend['All-rounder'],
          wicketkeeper_budget_remaining: CPL_2026.advisoryCategorySpend['WicketKeeper']
        })), {
          onConflict: 'team_id',
          ignoreDuplicates: false
        });

      if (teamsError) {
        console.error('Teams upsert error:', teamsError);
        throw teamsError;
      }

      // 2. Upsert players, holding back anyone already locked in pre-auction.
      const lockedIds = await this.getPreAuctionPlayerIds();
      const { safeToWrite, skipped } = splitOutPreAuctionPlayers(players, lockedIds);
      if (skipped.length > 0) {
        console.log(`Skipped ${skipped.length} pre-auction players:`, skipped);
      }

      const { error: playersError } = await supabase
        .from('players')
        .upsert(safeToWrite.map((player, index) => ({
          player_id: player.PlayerID,
          name: player.Name,
          role: player.Role,
          base_tokens: player.BaseTokens,
          photo_filename: player.PhotoFileName || null,
          department: player.Department || null,
          auction_order: index + 1,
          // Read captain data from Excel if available
          status: player.Status || 'Available',
          sold_to: player.SoldTo || null,
          sold_price: player.SoldPrice || 0,
          is_captain: player.IsCaptain || false,
          is_vice_captain: player.IsViceCaptain || false
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
        playersProcessed: safeToWrite.length,
        teamsProcessed: teams.length,
        message: `Merged ${safeToWrite.length} players and ${teams.length} teams` +
          (skipped.length > 0 ? ` (${skipped.length} pre-auction players preserved)` : '')
      };

    } catch (error) {
      console.error('Error merging Excel data into Supabase:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Writes a validated pre-auction workbook.
   *
   * Teams are upserted first so the players' sold_to values always point at a
   * team that exists. Callers MUST have run validatePreAuctionUpload first —
   * this method does not re-validate.
   */
  async uploadPreAuctionSquads(teamRows, normalizedPlayers) {
    try {
      const submittedAt = new Date().toISOString();

      const { error: teamsError } = await supabase
        .from('teams')
        .upsert(teamRows.map(team => ({
          team_id: team.TeamID,
          team_name: team.TeamName,
          logo_file: team.LogoFile || null,
          max_tokens: CPL_2026.auctionBudget,
          tokens_left: CPL_2026.auctionBudget,
          max_squad_size: CPL_2026.defaultSquadSize,
          // Advisory display figures only — never enforced. Seeded here so the
          // category panels agree with the config instead of the stale schema
          // defaults (400/400/200/150).
          batsman_budget_spent: 0,
          batsman_budget_remaining: CPL_2026.advisoryCategorySpend['Batsman'],
          bowler_budget_spent: 0,
          bowler_budget_remaining: CPL_2026.advisoryCategorySpend['Bowler'],
          allrounder_budget_spent: 0,
          allrounder_budget_remaining: CPL_2026.advisoryCategorySpend['All-rounder'],
          wicketkeeper_budget_spent: 0,
          wicketkeeper_budget_remaining: CPL_2026.advisoryCategorySpend['WicketKeeper'],
          batsman_count: 0,
          bowler_count: 0,
          allrounder_count: 0,
          wicketkeeper_count: 0,
          pre_auction_submitted: true,
          pre_auction_submitted_at: submittedAt
        })), { onConflict: 'team_id', ignoreDuplicates: false });

      if (teamsError) throw teamsError;

      const { error: playersError } = await supabase
        .from('players')
        .upsert(normalizedPlayers, { onConflict: 'player_id', ignoreDuplicates: false });

      if (playersError) throw playersError;

      return {
        success: true,
        message: `Loaded ${normalizedPlayers.length} pre-auction players across ${teamRows.length} teams`
      };
    } catch (error) {
      console.error('Error uploading pre-auction squads:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unlocks a team so its five can be re-uploaded.
   *
   * Releases the team's pre-auction players back to the auction pool. A player
   * dropped from the re-uploaded sheet therefore stays in the database and
   * becomes available for bidding, which is the intended outcome.
   */
  async reopenTeam(teamName) {
    try {
      const { error: playersError } = await supabase
        .from('players')
        .update({
          status: 'Available',
          sold_to: null,
          sold_price: 0,
          pre_auction_role: null,
          is_captain: false,
          is_vice_captain: false
        })
        .eq('sold_to', teamName)
        .eq('status', 'PreAuction');

      if (playersError) throw playersError;

      const { error: teamError } = await supabase
        .from('teams')
        .update({ pre_auction_submitted: false, pre_auction_submitted_at: null })
        .eq('team_name', teamName);

      if (teamError) throw teamError;

      return { success: true };
    } catch (error) {
      console.error('Error reopening team:', error);
      return { success: false, error: error.message };
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

      // 2. Reset players to Available status (EXCEPT captains and vice-captains)
      // Captains and vice-captains remain pre-assigned to their teams
      const { error: playersError } = await supabase
        .from('players')
        .update({
          status: 'Available',
          sold_to: null,
          sold_price: 0
        })
        .eq('is_captain', false)
        .eq('is_vice_captain', false);

      if (playersError) throw playersError;
      
      console.log('Players reset (captains/vice-captains preserved)');

      // 3. Reset team budgets and counts
      // Note: This resets to initial values. Captain/vice-captain costs will be
      // recalculated when data is loaded from the database
      const { error: teamsError } = await supabase
        .from('teams')
        .update({
          tokens_left: 1200,
          batsman_budget_spent: 0,
          batsman_budget_remaining: 350,
          bowler_budget_spent: 0,
          bowler_budget_remaining: 300,
          allrounder_budget_spent: 0,
          allrounder_budget_remaining: 350,
          wicketkeeper_budget_spent: 0,
          wicketkeeper_budget_remaining: 200,
          batsman_count: 0,
          bowler_count: 0,
          allrounder_count: 0,
          wicketkeeper_count: 0
        })
        .neq('id', 0);

      if (teamsError) throw teamsError;
      
      console.log('Team budgets reset to initial values');

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