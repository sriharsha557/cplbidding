import { CPL_2026 } from '../config/cpl2026';

// Role order for auction - CPL Category-based bidding
/**
 * Auction running order by category, and the single source for it: the player
 * sort, the phase numbering and the progress UI all derive from this array.
 *
 * Wicket-keepers go first. There are only three in the 2026 pool and five teams
 * still need one, so running them last put the scarcest category under the
 * hammer when budgets were already spent.
 */
export const ROLE_ORDER = ['WicketKeeper', 'Batsman', 'Bowler', 'All-rounder'];

export const ROLE_EMOJIS = {
  'Batsman': '🏏',
  'Bowler': '🎯',
  'WicketKeeper': '🧤',
  'All-rounder': '⚡'
};

/**
 * Squad-shape guidance per category — how many players of each role a balanced
 * 14-man squad wants. Advisory only: there are no per-category budgets and
 * nothing here blocks a bid. The five pre-auction players count toward these
 * totals — loadData tallies PreAuction rows into roleCount.
 */
export const CATEGORY_SHAPE = {
  'Batsman':      { minPlayers: 4, maxPlayers: 5, description: 'Core batting lineup', strategy: 'Invest heavily in batting core' },
  'Bowler':       { minPlayers: 4, maxPlayers: 5, description: 'Bowling attack', strategy: 'Balance between pace and spin' },
  'All-rounder':  { minPlayers: 3, maxPlayers: 4, description: 'Versatile players', strategy: 'Focus on versatility and value' },
  'WicketKeeper': { minPlayers: CPL_2026.minWicketKeepers, maxPlayers: 3, description: 'Wicket keeping specialists', strategy: 'One premium keeper + backup' }
};

// Total team budget for the auction phase, from config
export const TOTAL_TEAM_BUDGET = CPL_2026.auctionBudget;

// Sort players by role order, then by base tokens (descending)
export const sortPlayersByAuctionOrder = (players) => {
  return [...players].sort((a, b) => {
    const roleIndexA = ROLE_ORDER.indexOf(a.Role);
    const roleIndexB = ROLE_ORDER.indexOf(b.Role);
    
    // First sort by role order
    if (roleIndexA !== roleIndexB) {
      return roleIndexA - roleIndexB;
    }
    
    // Then by base tokens (higher first within same role)
    return b.BaseTokens - a.BaseTokens;
  });
};

// Group players by role
export const groupPlayersByRole = (players) => {
  const grouped = {};
  ROLE_ORDER.forEach(role => {
    grouped[role] = players.filter(player => player.Role === role);
  });
  return grouped;
};

// Get current auction phase based on player index
export const getCurrentAuctionPhase = (players, currentIndex) => {
  if (currentIndex >= players.length) return null;
  
  const currentPlayer = players[currentIndex];
  const currentRole = currentPlayer.Role;
  const roleIndex = ROLE_ORDER.indexOf(currentRole);
  
  // Calculate players in current category
  const playersInCategory = players.filter(p => p.Role === currentRole);
  const currentPlayerInCategory = players.slice(0, currentIndex + 1).filter(p => p.Role === currentRole).length;
  
  return {
    role: currentRole,
    emoji: ROLE_EMOJIS[currentRole],
    phase: roleIndex + 1,
    totalPhases: ROLE_ORDER.length,
    phaseName: `${currentRole}s Auction`,
    categoryProgress: {
      current: currentPlayerInCategory,
      total: playersInCategory.length,
      percentage: (currentPlayerInCategory / playersInCategory.length) * 100
    },
    shape: CATEGORY_SHAPE[currentRole]
  };
};

// Spend and headcount per category, tallied across all teams. Informational
// only — there are no per-category budgets. Spend is summed from each team's
// squad (BidPrice by role); pre-auction players cost nothing so they add 0.
export const getCategoryStatistics = (teams) => {
  const stats = {};

  ROLE_ORDER.forEach(role => {
    stats[role] = { totalSpent: 0, totalPlayers: 0, averagePrice: 0, teams: {} };

    Object.entries(teams).forEach(([teamName, teamData]) => {
      const squad = teamData.squad || [];
      const spent = squad
        .filter(p => p.Role === role)
        .reduce((sum, p) => sum + (Number(p.BidPrice) || 0), 0);
      const players = teamData.roleCount?.[role] || 0;

      stats[role].totalSpent += spent;
      stats[role].totalPlayers += players;
      stats[role].teams[teamName] = { spent, players };
    });

    if (stats[role].totalPlayers > 0) {
      stats[role].averagePrice = stats[role].totalSpent / stats[role].totalPlayers;
    }
  });

  return stats;
};

// Calculate auction progress
export const calculateAuctionProgress = (players, currentIndex, soldCount, unsoldCount) => {
  const total = players.length;
  const processed = soldCount + unsoldCount;
  const remaining = total - processed;
  
  return {
    total,
    processed,
    remaining,
    sold: soldCount,
    unsold: unsoldCount,
    percentage: total > 0 ? (processed / total) * 100 : 0
  };
};

// Validate team composition
export const validateTeamComposition = (team) => {
  const issues = [];
  const { squad, maxSquadSize, roleCount } = team;
  
  // Check squad size
  if (squad.length > maxSquadSize) {
    issues.push(`Squad exceeds maximum size (${squad.length}/${maxSquadSize})`);
  }
  
  // Check minimum role requirements
  if (roleCount.Batsman < 3) {
    issues.push(`Need at least 3 batsmen (current: ${roleCount.Batsman})`);
  }
  
  if (roleCount.Bowler < 3) {
    issues.push(`Need at least 3 bowlers (current: ${roleCount.Bowler})`);
  }
  
  if (roleCount.WicketKeeper < 1) {
    issues.push(`Need at least 1 wicket keeper (current: ${roleCount.WicketKeeper})`);
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Export team data to Excel format
export const formatTeamForExport = (teamName, teamData) => {
  return {
    teamName,
    tokensSpent: teamData.maxTokens - teamData.tokensLeft,
    tokensRemaining: teamData.tokensLeft,
    squadSize: teamData.squad.length,
    players: teamData.squad.map(player => ({
      name: player.Name,
      role: player.Role,
      basePrice: player.BaseTokens,
      boughtPrice: player.BidPrice,
      profit: player.BidPrice - player.BaseTokens
    })),
    roleBreakdown: teamData.roleCount
  };
};

// Sound effects (you can add actual audio files later)
export const playSound = (soundType) => {
  // Placeholder for sound effects
  console.log(`Playing sound: ${soundType}`);
  
  // You can implement actual audio playback here
  // const audio = new Audio(`/sounds/${soundType}.mp3`);
  // audio.play().catch(console.error);
};