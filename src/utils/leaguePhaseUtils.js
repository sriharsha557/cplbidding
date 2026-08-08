/**
 * League Phase Management Utilities
 * Handles: Retention → Trading → Auction phases
 */

export const LEAGUE_PHASES = {
  RETENTION: {
    id: 'retention',
    name: 'Retention',
    emoji: '🔒',
    icon: 'Lock',
    description: 'Teams retain their core players',
    order: 1,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-700',
    badgeColor: 'bg-red-100 text-red-800'
  },
  TRADING: {
    id: 'trading',
    name: 'Trading',
    emoji: '🔁',
    icon: 'ArrowRightLeft',
    description: 'Teams trade players',
    order: 2,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  AUCTION: {
    id: 'auction',
    name: 'Auction',
    emoji: '🔨',
    icon: 'Gavel',
    description: 'Open auction for remaining players',
    order: 3,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
    badgeColor: 'bg-green-100 text-green-800'
  }
};

export const PHASE_ORDER = [
  LEAGUE_PHASES.RETENTION,
  LEAGUE_PHASES.TRADING,
  LEAGUE_PHASES.AUCTION
];

/**
 * Calculate days remaining until deadline
 */
export const calculateDaysRemaining = (deadlineDate) => {
  if (!deadlineDate) return null;
  const deadline = new Date(deadlineDate);
  const now = new Date();
  const diffMs = deadline - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

/**
 * Calculate hours and minutes remaining
 */
export const calculateTimeRemaining = (deadlineDate) => {
  if (!deadlineDate) return null;
  const deadline = new Date(deadlineDate);
  const now = new Date();
  const diffMs = deadline - now;
  
  if (diffMs <= 0) return { hours: 0, minutes: 0, expired: true };
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, expired: false };
};

/**
 * Format countdown text
 */
export const formatCountdown = (deadlineDate) => {
  const timeRemaining = calculateTimeRemaining(deadlineDate);
  if (!timeRemaining) return 'No deadline';
  if (timeRemaining.expired) return 'Deadline passed';
  
  if (timeRemaining.hours > 24) {
    const days = Math.floor(timeRemaining.hours / 24);
    return `${days}d ${timeRemaining.hours % 24}h`;
  }
  return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
};

/**
 * Get phase status
 */
export const getPhaseStatus = (phase, isCompleted) => {
  if (isCompleted) return 'completed';
  return 'pending'; // Will be 'active' when currentPhase === phase
};

/**
 * Calculate retention statistics
 */
export const calculateRetentionStats = (teams) => {
  const stats = {
    teamsSubmitted: 0,
    teamsTotal: Object.keys(teams).length,
    totalPlayersRetained: 0,
    averagePlayersPerTeam: 0,
    totalPurseRemaining: 0,
    purseUsedForRetention: 0
  };

  Object.values(teams).forEach(team => {
    if (team.retentionSubmitted) stats.teamsSubmitted++;
    
    const retainedPlayers = team.squad?.filter(p => p.IsRetained)?.length || 0;
    stats.totalPlayersRetained += retainedPlayers;
    
    // Calculate purse usage
    if (team.retentionBudgetUsed) {
      stats.purseUsedForRetention += team.retentionBudgetUsed;
    }
    
    if (team.tokensLeft) {
      stats.totalPurseRemaining += team.tokensLeft;
    }
  });

  stats.averagePlayersPerTeam = stats.teamsTotal > 0 
    ? (stats.totalPlayersRetained / stats.teamsTotal).toFixed(1)
    : 0;

  return stats;
};

/**
 * Calculate trading statistics
 */
export const calculateTradingStats = (teams) => {
  const stats = {
    totalTrades: 0,
    pendingApprovals: 0,
    approvedTrades: 0,
    completedTrades: 0,
    mostActiveTeam: null,
    mostActiveTeamTrades: 0
  };

  const teamTradeCount = {};

  Object.entries(teams).forEach(([teamName, team]) => {
    if (team.trades && Array.isArray(team.trades)) {
      team.trades.forEach(trade => {
        stats.totalTrades++;
        
        if (trade.status === 'pending') stats.pendingApprovals++;
        if (trade.status === 'approved') stats.approvedTrades++;
        if (trade.status === 'completed') stats.completedTrades++;
        
        // Track team activity
        teamTradeCount[teamName] = (teamTradeCount[teamName] || 0) + 1;
      });
    }
  });

  // Find most active team
  Object.entries(teamTradeCount).forEach(([teamName, count]) => {
    if (count > stats.mostActiveTeamTrades) {
      stats.mostActiveTeamTrades = count;
      stats.mostActiveTeam = teamName;
    }
  });

  return stats;
};

/**
 * Get current phase details
 */
export const getCurrentPhaseDetails = (currentPhaseId) => {
  return LEAGUE_PHASES[Object.keys(LEAGUE_PHASES).find(
    key => LEAGUE_PHASES[key].id === currentPhaseId
  )];
};

/**
 * Get phase progress (0-100%)
 */
export const getPhaseProgress = (currentPhaseId) => {
  const phase = getCurrentPhaseDetails(currentPhaseId);
  if (!phase) return 0;
  return (phase.order / PHASE_ORDER.length) * 100;
};

/**
 * Format phase transition message
 */
export const getPhaseTransitionMessage = (fromPhase, toPhase) => {
  const transitions = {
    'retention->trading': '✅ Retention complete! Trading window opens now.',
    'trading->auction': '🎯 Trading closed! Auction begins now.',
    'auction->complete': '🏆 Auction complete! Tournament ready.'
  };
  
  return transitions[`${fromPhase}->${toPhase}`] || 'Phase updated.';
};

/**
 * Sample league state structure
 */
export const createInitialLeagueState = () => ({
  currentPhase: 'retention', // retention | trading | auction
  retentionDeadline: null,
  tradingDeadline: null,
  auctionStartTime: null,
  leagueStats: {
    playersRetained: 0,
    totalTrades: 0,
    auctionProgress: 0
  }
});
