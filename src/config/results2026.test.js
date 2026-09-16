import { RESULTS_2026, CRICHEROES_URL, resultFor } from './results2026';
import { SCHEDULE_2026, scheduleTeam } from './schedule2026';

describe('RESULTS_2026', () => {
  it('links to the CricHeroes past-matches page', () => {
    expect(CRICHEROES_URL).toBe('https://cricheroes.com/tournament/2183134/cpl-2026/matches/past-matches');
  });

  it('ties every result to a real scheduled match', () => {
    const known = new Set(SCHEDULE_2026.map(m => m.matchNo));
    RESULTS_2026.forEach(r => expect(known.has(r.matchNo)).toBe(true));
  });

  it('gives each result exactly two scorelines for real teams', () => {
    RESULTS_2026.forEach(r => {
      expect(r.scores).toHaveLength(2);
      r.scores.forEach(line => {
        expect(scheduleTeam(line.teamId)).not.toBeNull();
        expect(line.score).toMatch(/^\d+\/(\d{1,2}|10)$/);
      });
    });
  });

  it('names the winner as one of the two teams that played', () => {
    RESULTS_2026.forEach(r => {
      const ids = r.scores.map(s => s.teamId);
      expect(ids).toContain(r.winner);
    });
  });

  it('resultFor looks up by match number and misses cleanly', () => {
    expect(resultFor(1)).toBe(RESULTS_2026[0]);
    expect(resultFor(999)).toBeNull();
  });
});
