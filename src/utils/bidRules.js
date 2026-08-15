import { CPL_2026 } from '../config/cpl2026';

/** Published maximum bid for a category. Unknown roles fall back to the budget. */
export function maxBidFor(role) {
  const max = CPL_2026.maxBidByCategory[role];
  return max === undefined ? CPL_2026.auctionBudget : max;
}

/**
 * The three hard rules for CPL 2026. Category spend caps are advisory and are
 * deliberately NOT checked here — blocking on a rule that is not in the
 * published document cannot be explained to a room mid-auction.
 */
export function validateBid(team, playerRole, price) {
  if (!team) return { valid: false, reason: 'No team selected.' };

  if (team.squad.length >= team.maxSquadSize) {
    return { valid: false, reason: `Squad is full (${team.maxSquadSize} players).` };
  }

  const max = maxBidFor(playerRole);
  if (price > max) {
    return { valid: false, reason: `${playerRole} bids are capped at ${max} coins.` };
  }

  if (price > team.tokensLeft) {
    return { valid: false, reason: `Only ${team.tokensLeft} coins left in the purse.` };
  }

  return { valid: true, reason: null };
}

/**
 * True when a team is down to its final slot with no wicket keeper.
 * Surfaced as a warning — every squad needs at least one keeper.
 */
export function needsWicketKeeper(team) {
  if (!team) return false;
  const slotsLeft = team.maxSquadSize - team.squad.length;
  const keepers = team.roleCount?.WicketKeeper || 0;
  return keepers < CPL_2026.minWicketKeepers && slotsLeft <= CPL_2026.minWicketKeepers;
}
