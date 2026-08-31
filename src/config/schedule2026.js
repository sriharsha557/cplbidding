import { TEAMS_2026 } from './teams2026';

/**
 * CPL 2026 match schedule — the fixture list as published by the organisers.
 *
 * Each pool plays a single round-robin (six matches). Matches 7 and 8 run on
 * 20 September at a ground still to be confirmed (`tentative`); the rest are on
 * the three Saturdays at Runrate. Knockout slots stay null with a `note` until
 * the league table decides them.
 */
const LEAGUE_VENUE = 'Runrate';
const LEAGUE_VENUE_MAP = 'https://maps.app.goo.gl/ZMXje57CPfVdBygu9';
const KNOCKOUT_VENUE = 'Centurion';
const KNOCKOUT_VENUE_MAP = 'https://maps.app.goo.gl/Cojyr19FjuPF8FkG6';
const TBC_VENUE = 'To be confirmed';
const SLOT_1 = '11:00–13:30';
const SLOT_2 = '14:30–17:00';

const T = Object.fromEntries(TEAMS_2026.map(t => [t.name, t.id]));
const league = (matchNo, pool, date, time, teamA, teamB, extra = {}) => ({
  matchNo, stage: 'League', pool, date, time, overs: 15,
  venue: LEAGUE_VENUE, venueUrl: LEAGUE_VENUE_MAP, teamA, teamB, ...extra
});
/** 20 September ground is not fixed yet. */
const TBC = { venue: TBC_VENUE, venueUrl: null, tentative: true, venueNote: 'Ground to be confirmed — we’ll keep you posted.' };

export const SCHEDULE_2026 = [
  // --- 12 September ---
  league(1, 'Pool A', '2026-09-12', SLOT_1, T['Quality Strikers'], T['Hits & Misses']),
  league(2, 'Pool A', '2026-09-12', SLOT_2, T['Mavericks'], T['CSK']),
  league(3, 'Pool B', '2026-09-12', SLOT_1, T['Pirates'], T['Avengers']),
  league(4, 'Pool B', '2026-09-12', SLOT_2, T['Digititans'], T['Fearless Falcons']),
  // --- 19 September ---
  league(5, 'Pool A', '2026-09-19', SLOT_1, T['Mavericks'], T['Quality Strikers']),
  league(6, 'Pool B', '2026-09-19', SLOT_2, T['Avengers'], T['Fearless Falcons']),
  // --- 20 September (date and ground both tentative) ---
  league(7, 'Pool B', '2026-09-20', SLOT_1, T['Pirates'], T['Digititans'], TBC),
  league(8, 'Pool A', '2026-09-20', SLOT_2, T['CSK'], T['Hits & Misses'], TBC),
  // --- 26 September ---
  league(9,  'Pool A', '2026-09-26', SLOT_1, T['Mavericks'], T['Hits & Misses']),
  league(10, 'Pool A', '2026-09-26', SLOT_2, T['CSK'], T['Quality Strikers']),
  league(11, 'Pool B', '2026-09-26', SLOT_1, T['Pirates'], T['Fearless Falcons']),
  league(12, 'Pool B', '2026-09-26', SLOT_2, T['Digititans'], T['Avengers']),
  // --- 3 October: semi-finals (Centurion) ---
  { matchNo: 13, stage: 'Semi Final', label: 'Semi Final 1', date: '2026-10-03', time: '11:00–14:00', overs: 20, venue: KNOCKOUT_VENUE, venueUrl: KNOCKOUT_VENUE_MAP, teamA: null, teamB: null, note: 'Pool A winner v Pool B runner-up' },
  { matchNo: 14, stage: 'Semi Final', label: 'Semi Final 2', date: '2026-10-03', time: '14:30–17:30', overs: 20, venue: KNOCKOUT_VENUE, venueUrl: KNOCKOUT_VENUE_MAP, teamA: null, teamB: null, note: 'Pool B winner v Pool A runner-up' },
  // --- 4 October: final (Centurion) ---
  { matchNo: 15, stage: 'Final', label: 'Final', date: '2026-10-04', time: '11:00–14:00', overs: 20, venue: KNOCKOUT_VENUE, venueUrl: KNOCKOUT_VENUE_MAP, teamA: null, teamB: null, note: 'Semi Final winners' }
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
  venue: matches[0].venue || null,
  venueUrl: matches[0].venueUrl || null,
  venueNote: matches[0].venueNote || null,
  pools: matches.some(m => m.pool)
    ? [...new Set(matches.map(m => m.pool))].map(pool => ({
        pool,
        matches: matches.filter(m => m.pool === pool)
      }))
    : null,
  matches
}));

export default SCHEDULE_2026;
