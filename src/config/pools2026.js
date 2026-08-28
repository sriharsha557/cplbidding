import { TEAMS_2026 } from './teams2026';

/**
 * The two league pools. Each plays a single round-robin (six matches) before the
 * knockouts. Order within a pool is the seeding used to lay out the fixtures
 * (1v2 / 3v4, 1v3 / 2v4, 1v4 / 2v3) — see schedule2026.js.
 */
export const POOLS_2026 = {
  'Pool A': ['CPL_T04', 'CPL_T07', 'CPL_T05', 'CPL_T03'], // Mavericks, CSK, Quality Strikers, Hits & Misses
  'Pool B': ['CPL_T06', 'CPL_T08', 'CPL_T01', 'CPL_T02']  // Pirates, Digi Titans, Avengers, Fearless Falcons
};

/** The draw is final. */
export const POOLS_PROVISIONAL = false;

/** 'Pool A' | 'Pool B' | null */
export function poolOf(teamId) {
  return Object.keys(POOLS_2026).find(name => POOLS_2026[name].includes(teamId)) || null;
}

/** Pool name -> the team objects in it, in seeded order. */
export function poolTeams(poolName) {
  return (POOLS_2026[poolName] || [])
    .map(id => TEAMS_2026.find(t => t.id === id))
    .filter(Boolean);
}

export default POOLS_2026;
