import { TEAMS_2026 } from './teams2026';

/**
 * CPL 2026 match schedule — the fixture list as published by the organisers.
 *
 * Each pool plays a single round-robin (six matches). Matches 6 and 8 were
 * pushed to a tentative 20 September date; the rest run on the three Saturdays.
 * Knockout slots stay null with a `note` until the league table decides them.
 */
const LEAGUE_VENUE = '';       // TBD — league ground not yet named
const KNOCKOUT_VENUE = 'Centurion';
const SLOT_1 = '11:00–13:30';
const SLOT_2 = '14:30–17:00';

const T = Object.fromEntries(TEAMS_2026.map(t => [t.name, t.id]));

export const SCHEDULE_2026 = [
  // --- 12 September ---
  { matchNo: 1,  stage: 'League', pool: 'Pool A', date: '2026-09-12', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: T['Quality Strikers'], teamB: T['Hits & Misses'] },
  { matchNo: 2,  stage: 'League', pool: 'Pool A', date: '2026-09-12', time: SLOT_2, overs: 15, venue: LEAGUE_VENUE, teamA: T['Mavericks'], teamB: T['CSK'] },
  { matchNo: 3,  stage: 'League', pool: 'Pool B', date: '2026-09-12', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: T['Pirates'], teamB: T['Avengers'] },
  { matchNo: 4,  stage: 'League', pool: 'Pool B', date: '2026-09-12', time: SLOT_2, overs: 15, venue: LEAGUE_VENUE, teamA: T['Digititans'], teamB: T['Fearless Falcons'] },
  // --- 19 September ---
  { matchNo: 5,  stage: 'League', pool: 'Pool A', date: '2026-09-19', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: T['Mavericks'], teamB: T['Quality Strikers'] },
  { matchNo: 6,  stage: 'League', pool: 'Pool A', date: '2026-09-20', time: SLOT_2, overs: 15, venue: LEAGUE_VENUE, teamA: T['CSK'], teamB: T['Hits & Misses'], tentative: true },
  { matchNo: 7,  stage: 'League', pool: 'Pool B', date: '2026-09-19', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: T['Avengers'], teamB: T['Fearless Falcons'] },
  // --- 20 September (tentative) ---
  { matchNo: 8,  stage: 'League', pool: 'Pool B', date: '2026-09-20', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: T['Pirates'], teamB: T['Digititans'], tentative: true },
  // --- 26 September ---
  { matchNo: 9,  stage: 'League', pool: 'Pool A', date: '2026-09-26', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: T['Mavericks'], teamB: T['Hits & Misses'] },
  { matchNo: 10, stage: 'League', pool: 'Pool A', date: '2026-09-26', time: SLOT_2, overs: 15, venue: LEAGUE_VENUE, teamA: T['CSK'], teamB: T['Quality Strikers'] },
  { matchNo: 11, stage: 'League', pool: 'Pool B', date: '2026-09-26', time: SLOT_1, overs: 15, venue: LEAGUE_VENUE, teamA: T['Pirates'], teamB: T['Fearless Falcons'] },
  { matchNo: 12, stage: 'League', pool: 'Pool B', date: '2026-09-26', time: SLOT_2, overs: 15, venue: LEAGUE_VENUE, teamA: T['Digititans'], teamB: T['Avengers'] },
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
  '2026-09-12': '12 September', '2026-09-19': '19 September', '2026-09-20': '20 September',
  '2026-09-26': '26 September', '2026-10-03': '3 October', '2026-10-04': '4 October'
};

/** Team id -> the team object, for renderers. Returns null for TBD slots. */
export function scheduleTeam(id) {
  return id ? TEAMS_2026.find(t => t.id === id) || null : null;
}

/**
 * SCHEDULE_2026 grouped for rendering, one entry per match day, mirroring the
 * published grid: league days carry a mini-table per pool, knockout days a flat
 * list. A day is `tentative` if all its matches are.
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
  tentative: matches.every(m => m.tentative),
  pools: matches.some(m => m.pool)
    ? [...new Set(matches.map(m => m.pool))].map(pool => ({
        pool,
        matches: matches.filter(m => m.pool === pool)
      }))
    : null,
  matches
}));

export default SCHEDULE_2026;
