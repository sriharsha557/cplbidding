/**
 * CPL 2026 teams and pre-auction status — display source of truth.
 *
 * `name` is the canonical team name and MUST match teams.team_name in Supabase:
 * players.sold_to is a foreign key onto that column, so renaming it here breaks
 * squad references. `displayName` is what the public page renders, which is how
 * DIGI TITANS appears in comms while the stored row stays "Digititans".
 *
 * Auction rules are NOT duplicated here — see cpl2026.js. AuctionFormat reads
 * that config directly so published numbers cannot drift from enforced ones.
 */
export const TEAMS_2026 = [
  { id: 'CPL_T01', name: 'Avengers', displayName: 'Avengers', logo: '/Avengers.png' },
  { id: 'CPL_T02', name: 'Fearless Falcons', displayName: 'Fearless Falcons', logo: '/Feralessfalcons.png' },
  { id: 'CPL_T03', name: 'Hits & Misses', displayName: 'Hits & Misses', logo: '/HitsMisses.png' },
  { id: 'CPL_T04', name: 'Mavericks', displayName: 'Mavericks', logo: '/Mavericks.png' },
  { id: 'CPL_T05', name: 'Quality Strikers', displayName: 'Quality Strikers', logo: '/quality_strikers.png' },
  { id: 'CPL_T06', name: 'Pirates', displayName: 'Pirates', logo: '/Pirates.png' },
  { id: 'CPL_T07', name: 'CSK', displayName: 'CSK', logo: '/csk.png' },
  { id: 'CPL_T08', name: 'Digititans', displayName: 'DIGI TITANS', logo: '/digititans.png', isDefendingChampion: true }
];

/** Ownership call. Update `confirmed` as replies come in. */
export const OWNERSHIP = {
  confirmed: 4,
  total: 8,
  deadline: '2026-08-24'
};

/** What is already locked in ahead of the auction. */
export const PRE_AUCTION_STATUS = {
  slotsLocked: 3,
  captainsSet: true,
  viceCaptainsSet: true
};

export const DEFENDING_CHAMPION_SEASON = 2025;

/**
 * Whole days from `today` until the ownership deadline.
 * Returns 0 on the deadline day and negative once it has passed, so callers can
 * distinguish "closes today" from "closed" instead of showing negative days.
 */
export function daysUntilDeadline(deadline = OWNERSHIP.deadline, today = new Date()) {
  const end = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((end - start) / 86400000);
}

/** Confirmed count clamped to the roster, so a bad edit cannot render "9 of 8". */
export function ownershipProgress(ownership = OWNERSHIP) {
  const total = Math.max(0, ownership.total || 0);
  const confirmed = Math.min(Math.max(0, ownership.confirmed || 0), total);
  return { confirmed, total, pending: total - confirmed, isComplete: total > 0 && confirmed === total };
}

export default TEAMS_2026;
