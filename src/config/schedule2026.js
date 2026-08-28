import { TEAMS_2026 } from './teams2026';

/**
 * CPL 2026 match schedule.
 *
 * League match-ups follow the standard 4-team round-robin over the pool seeding
 * in pools2026.js: round 1 is 1v2 / 3v4, round 2 is 1v3 / 2v4, round 3 is
 * 1v4 / 2v3. Pool A plays on ground 1, Pool B on ground 2, in the same slots.
 * Knockout slots stay null with a `note` until the league table decides them.
 */
const LEAGUE_VENUE = '';       // TBD — league ground not yet named
const KNOCKOUT_VENUE = 'Centurion';
const SLOT_1 = '11:00–13:30';
const SLOT_2 = '14:30–17:00';

// team ids by pool seed, kept in step with pools2026.js
const A = ['CPL_T04', 'CPL_T07', 'CPL_T05', 'CPL_T03'];
const B = ['CPL_T06', 'CPL_T08', 'CPL_T01', 'CPL_T02'];

export const SCHEDULE_2026 = [
  // --- 12 September: round 1 (1v2, 3v4) ---
  { matchNo: 1,  stage: 'League', pool: 'Pool A', date: '2026-09-12', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: A[0], teamB: A[1] },
  { matchNo: 2,  stage: 'League', pool: 'Pool A', date: '2026-09-12', time: SLOT_2, overs: 15, venue: LEAGUE_VENUE, teamA: A[2], teamB: A[3] },
  { matchNo: 3,  stage: 'League', pool: 'Pool B', date: '2026-09-12', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: B[0], teamB: B[1] },
  { matchNo: 4,  stage: 'League', pool: 'Pool B', date: '2026-09-12', time: SLOT_2, overs: 15, venue: LEAGUE_VENUE, teamA: B[2], teamB: B[3] },
  // --- 19 September: round 2 (1v3, 2v4) ---
  { matchNo: 5,  stage: 'League', pool: 'Pool A', date: '2026-09-19', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: A[0], teamB: A[2] },
  { matchNo: 6,  stage: 'League', pool: 'Pool A', date: '2026-09-19', time: SLOT_2, overs: 15, venue: LEAGUE_VENUE, teamA: A[1], teamB: A[3] },
  { matchNo: 7,  stage: 'League', pool: 'Pool B', date: '2026-09-19', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: B[0], teamB: B[2] },
  { matchNo: 8,  stage: 'League', pool: 'Pool B', date: '2026-09-19', time: SLOT_2, overs: 15, venue: LEAGUE_VENUE, teamA: B[1], teamB: B[3] },
  // --- 26 September: round 3 (1v4, 2v3) ---
  { matchNo: 9,  stage: 'League', pool: 'Pool A', date: '2026-09-26', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: A[0], teamB: A[3] },
  { matchNo: 10, stage: 'League', pool: 'Pool A', date: '2026-09-26', time: SLOT_2, overs: 15, venue: LEAGUE_VENUE, teamA: A[1], teamB: A[2] },
  { matchNo: 11, stage: 'League', pool: 'Pool B', date: '2026-09-26', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: B[0], teamB: B[3] },
  { matchNo: 12, stage: 'League', pool: 'Pool B', date: '2026-09-26', time: SLOT_2, overs: 15, venue: LEAGUE_VENUE, teamA: B[1], teamB: B[2] },
  // --- 3 October: semi-finals (Centurion) ---
  { matchNo: 13, stage: 'Semi Final', label: 'Semi Final 1', date: '2026-10-03', time: '11:00–14:00', overs: 20, venue: KNOCKOUT_VENUE, teamA: null, teamB: null, note: 'Pool A winner v Pool B runner-up' },
  { matchNo: 14, stage: 'Semi Final', label: 'Semi Final 2', date: '2026-10-03', time: '14:30–17:30', overs: 20, venue: KNOCKOUT_VENUE, teamA: null, teamB: null, note: 'Pool B winner v Pool A runner-up' },
  // --- 4 October: final (Centurion) ---
  { matchNo: 15, stage: 'Final', label: 'Final', date: '2026-10-04', time: '11:00–14:00', overs: 20, venue: KNOCKOUT_VENUE, teamA: null, teamB: null, note: 'Semi Final winners' }
];

/** Kept in step with SCHEDULE_2026; the number the public page headlines. */
export const TOTAL_MATCHES = SCHEDULE_2026.length;
export const SEASON_START = '2026-09-12';

const DATE_LABELS = {
  '2026-09-12': '12 September', '2026-09-19': '19 September', '2026-09-26': '26 September',
  '2026-10-03': '3 October', '2026-10-04': '4 October'
};

/** Team id -> the team object, for renderers. Returns null for TBD slots. */
export function scheduleTeam(id) {
  return id ? TEAMS_2026.find(t => t.id === id) || null : null;
}

/**
 * SCHEDULE_2026 grouped for rendering, one entry per match day, mirroring the
 * published grid: league days carry a mini-table per pool, knockout days a flat
 * list.
 */
export const SCHEDULE_BY_DATE = Object.entries(
  SCHEDULE_2026.reduce((acc, m) => {
    (acc[m.date] = acc[m.date] || []).push(m);
    return acc;
  }, {})
).map(([date, matches]) => ({
  date,
  label: DATE_LABELS[date] || date,
  stage: matches[0].stage,
  pools: matches.some(m => m.pool)
    ? [...new Set(matches.map(m => m.pool))].map(pool => ({
        pool,
        matches: matches.filter(m => m.pool === pool)
      }))
    : null,
  matches
}));

export default SCHEDULE_2026;
