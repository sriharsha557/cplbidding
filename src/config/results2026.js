/**
 * CPL 2026 match results, entered by hand from the CricHeroes scorecards as
 * each round is played. `matchNo` ties a result back to SCHEDULE_2026.
 *
 * `scores` lists both innings in scorecard order (not necessarily teamA/teamB
 * order); `winner` is the team id that won, used to bold their line.
 */
export const CRICHEROES_URL = 'https://cricheroes.com/tournament/2183134/cpl-2026/matches/past-matches';

export const RESULTS_2026 = [
  {
    matchNo: 1,
    scores: [
      { teamId: 'CPL_T03', score: '81/8', overs: '15.0' },  // Hits & Misses
      { teamId: 'CPL_T05', score: '82/1', overs: '9.0' }    // Quality Strikers
    ],
    result: 'Quality Strikers won by 9 wickets',
    winner: 'CPL_T05'
  },
  {
    matchNo: 2,
    scores: [
      { teamId: 'CPL_T07', score: '178/2', overs: '15.0' }, // CSK
      { teamId: 'CPL_T04', score: '96/10', overs: '12.4' }  // Mavericks
    ],
    result: 'Colruyt Super Kings won by 82 runs',
    winner: 'CPL_T07'
  },
  {
    matchNo: 3,
    scores: [
      { teamId: 'CPL_T01', score: '127/5', overs: '15.0' }, // Avengers XI
      { teamId: 'CPL_T06', score: '45/10', overs: '10.3' }  // Pirates XI
    ],
    result: 'Avengers XI won by 82 runs',
    winner: 'CPL_T01'
  },
  {
    matchNo: 4,
    scores: [
      { teamId: 'CPL_T08', score: '128/8', overs: '15.0' }, // Digititans
      { teamId: 'CPL_T02', score: '129/6', overs: '14.4' }  // Fearless Falcons
    ],
    result: 'Fearless Falcons won by 4 wickets',
    winner: 'CPL_T02'
  }
];

/** The result for a match number, or null if it hasn't been played/entered yet. */
export function resultFor(matchNo) {
  return RESULTS_2026.find(r => r.matchNo === matchNo) || null;
}

export default RESULTS_2026;
