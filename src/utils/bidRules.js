import { CPL_2026 } from '../config/cpl2026';

/**
 * The flat maximum bid for any player. The `role` argument is accepted so
 * callers can stay role-aware, but 2026 has no per-category caps — every role
 * shares the same limit.
 */
export function maxBidFor(role) {
  return CPL_2026.maxBidPerPlayer;
}

/**
 * The hard rules for CPL 2026: a positive bid, a squad with room, the flat
 * per-player cap, and enough coins left in the purse. There are no per-category
 * budgets to check.
 */
export function validateBid(team, playerRole, price) {
  if (!team) return { valid: false, reason: 'No team selected.' };

  if (!Number.isFinite(price) || price <= 0) {
    return { valid: false, reason: 'Enter a bid amount.' };
  }

  if (team.squad.length >= team.maxSquadSize) {
    return { valid: false, reason: `Squad is full (${team.maxSquadSize} players).` };
  }

  const max = maxBidFor(playerRole);
  if (price > max) {
    return { valid: false, reason: `Bids are capped at ${max} coins.` };
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
