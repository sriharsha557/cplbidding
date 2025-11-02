import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Player {
  PlayerID: string
  Name: string
  Role: string
  Department?: string
  BaseTokens: number
  PhotoFileName?: string
}

interface Team {
  TeamID: string
  TeamName: string
  LogoFile?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { players, teams } = await req.json()

    console.log(`Processing ${players?.length || 0} players and ${teams?.length || 0} teams`)

    // Merge Teams Data
    if (teams && Array.isArray(teams)) {
      for (const team of teams) {
        const teamData = {
          team_id: team.TeamID,
          team_name: team.TeamName,
          logo_file: team.LogoFile || null,
          max_tokens: 1000,
          max_squad_size: 15,
          tokens_left: 1000,
          // Reset category budgets
          batsman_budget_spent: 0,
          batsman_budget_remaining: 400,
          bowler_budget_spent: 0,
          bowler_budget_remaining: 400,
          allrounder_budget_spent: 0,
          allrounder_budget_remaining: 200,
          wicketkeeper_budget_spent: 0,
          wicketkeeper_budget_remaining: 150,
          // Reset role counts
          batsman_count: 0,
          bowler_count: 0,
          allrounder_count: 0,
          wicketkeeper_count: 0
        }

        // Upsert team (insert or update if exists)
        const { error: teamError } = await supabaseClient
          .from('teams')
          .upsert(teamData, { 
            onConflict: 'team_id',
            ignoreDuplicates: false 
          })

        if (teamError) {
          console.error('Error upserting team:', teamError)
          throw teamError
        }
      }
    }

    // Merge Players Data
    if (players && Array.isArray(players)) {
      // First, get existing players to preserve auction status
      const { data: existingPlayers } = await supabaseClient
        .from('players')
        .select('player_id, status, sold_to, sold_price')

      const existingPlayersMap = new Map(
        existingPlayers?.map(p => [p.player_id, p]) || []
      )

      for (let i = 0; i < players.length; i++) {
        const player = players[i]
        const existing = existingPlayersMap.get(player.PlayerID)

        const playerData = {
          player_id: player.PlayerID,
          name: player.Name,
          role: player.Role,
          department: player.Department || null,
          base_tokens: player.BaseTokens,
          photo_filename: player.PhotoFileName || null,
          auction_order: i + 1,
          // Preserve auction status if player already exists
          status: existing?.status || 'Available',
          sold_to: existing?.sold_to || null,
          sold_price: existing?.sold_price || 0
        }

        // Upsert player (insert or update if exists)
        const { error: playerError } = await supabaseClient
          .from('players')
          .upsert(playerData, { 
            onConflict: 'player_id',
            ignoreDuplicates: false 
          })

        if (playerError) {
          console.error('Error upserting player:', playerError)
          throw playerError
        }
      }

      // Update auction state
      const { error: stateError } = await supabaseClient
        .from('auction_state')
        .update({ 
          total_players: players.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)

      if (stateError) {
        console.error('Error updating auction state:', stateError)
      }
    }

    // Get updated counts
    const { data: playerCounts } = await supabaseClient
      .from('players')
      .select('status')

    const counts = {
      total: playerCounts?.length || 0,
      available: playerCounts?.filter(p => p.status === 'Available').length || 0,
      sold: playerCounts?.filter(p => p.status === 'Sold').length || 0,
      unsold: playerCounts?.filter(p => p.status === 'Unsold').length || 0
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Excel data merged successfully',
        counts,
        teamsProcessed: teams?.length || 0,
        playersProcessed: players?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in merge-excel-data function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})