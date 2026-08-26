/**
 * CPL 2026 teams and pre-auction status — display source of truth.
 *
 * `name` is the canonical team name and MUST match teams.team_name in Supabase:
 * players.sold_to is a foreign key onto that column, so renaming it here breaks
 * squad references. `displayName` is what the public page renders, which is how
 * DIGI TITANS appears in comms while the stored row stays "Digititans".
 *
 * Team names, owners and the auction pool size come from CPL2026.xlsx
 * ("Retained" and "Auction Players" sheets), which supersedes the 2025-era
 * mapping in scripts/update_team_names_and_logos.py.
 *
 * Auction rules are NOT duplicated here — see cpl2026.js. AuctionFormat reads
 * that config directly so published numbers cannot drift from enforced ones.
 */
export const TEAMS_2026 = [
  { id: 'CPL_T01', name: 'Avengers', displayName: 'Avengers XI', owner: 'Shilpa Kuber', logo: '/Avengers.png' },
  { id: 'CPL_T02', name: 'Fearless Falcons', displayName: 'Fearless Falcons', owner: 'Sravan Mallampeta', logo: '/Feralessfalcons.png' },
  { id: 'CPL_T03', name: 'Hits & Misses', displayName: 'Hits & Misses', owner: 'Indranil Chowdhury', logo: '/HitsMisses.png' },
  { id: 'CPL_T04', name: 'Mavericks', displayName: 'Mavericks', owner: 'Anuradha Sharma & Imran', logo: '/Mavericks.png' },
  { id: 'CPL_T05', name: 'Quality Strikers', displayName: 'Quality Strikers', owner: 'Rakesh Sinha', logo: '/quality_strikers.png' },
  { id: 'CPL_T06', name: 'Pirates', displayName: 'Pirates XI', owner: 'Kishore Vunnam', logo: '/Pirates.png' },
  { id: 'CPL_T07', name: 'CSK', displayName: 'Colruyt Super Kings', owner: 'Shaik Sharfuddin', logo: '/csk.png' },
  { id: 'CPL_T08', name: 'Digititans', displayName: 'DIGI TITANS', owner: 'Srini Guda', logo: '/digititans.png', isDefendingChampion: true }
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
 * Registered players contesting the auction, after blank rows are dropped and
 * 4YVM is removed as a duplicate registration of a retained Vice-Captain.
 * Keep in step with scripts/export_auction_players_from_cpl2026.js.
 */
export const AUCTION_POOL_SIZE = 65;

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
