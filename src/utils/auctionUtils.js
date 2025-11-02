// Role order for auction
export const ROLE_ORDER = ['Batsman', 'Bowler', 'All-rounder', 'WicketKeeper'];

export const ROLE_EMOJIS = {
  'Batsman': '🏏',
  'Bowler': '🎯',
  'WicketKeeper': '🧤',
  'All-rounder': '⚡'
};

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
  
  return {
    role: currentRole,
    emoji: ROLE_EMOJIS[currentRole],
    phase: roleIndex + 1,
    totalPhases: ROLE_ORDER.length,
    phaseName: `${currentRole}s Auction`
  };
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