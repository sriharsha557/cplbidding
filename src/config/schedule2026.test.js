import { SCHEDULE_2026, SCHEDULE_BY_DATE, TOTAL_MATCHES, scheduleTeam } from './schedule2026';
import { poolOf } from './pools2026';
import { TEAMS_2026 } from './teams2026';

describe('SCHEDULE_2026', () => {
  it('has 12 league matches, 2 semis and a final', () => {
    expect(SCHEDULE_2026.filter(m => m.stage === 'League')).toHaveLength(12);
    expect(SCHEDULE_2026.filter(m => m.stage === 'Semi Final')).toHaveLength(2);
    expect(SCHEDULE_2026.filter(m => m.stage === 'Final')).toHaveLength(1);
    expect(TOTAL_MATCHES).toBe(15);
  });

  it('numbers matches 1..15 with no gaps', () => {
    expect(SCHEDULE_2026.map(m => m.matchNo)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1)
    );
  });

  it('runs league matches at 15 overs and knockouts at 20', () => {
    SCHEDULE_2026.forEach(m => {
      expect(m.overs).toBe(m.stage === 'League' ? 15 : 20);
    });
  });

  it('plays the league across the four September dates', () => {
    const byDate = SCHEDULE_2026
      .filter(m => m.stage === 'League')
      .reduce((acc, m) => ({ ...acc, [m.date]: (acc[m.date] || 0) + 1 }), {});
    expect(byDate).toEqual({
      '2026-09-12': 4, '2026-09-19': 3, '2026-09-20': 1, '2026-09-26': 4
    });
  });

  it('flags Match 8 (Pirates v Digi Titans) as tentative', () => {
    const m8 = SCHEDULE_2026.find(m => m.matchNo === 8);
    expect(m8.tentative).toBe(true);
    expect(m8.date).toBe('2026-09-20');
    expect(SCHEDULE_2026.filter(m => m.tentative)).toHaveLength(1);
  });

  it('runs a full single round-robin per pool (each team plays the other three)', () => {
    ['Pool A', 'Pool B'].forEach(pool => {
      const games = SCHEDULE_2026.filter(m => m.pool === pool);
      expect(games).toHaveLength(6);
      const ids = [...new Set(games.flatMap(m => [m.teamA, m.teamB]))];
      expect(ids).toHaveLength(4);
      ids.forEach(id => {
        const played = games.filter(m => m.teamA === id || m.teamB === id);
        expect(played).toHaveLength(3);
      });
    });
  });

  it('keeps any assigned league match inside one pool', () => {
    SCHEDULE_2026
      .filter(m => m.stage === 'League' && m.teamA && m.teamB)
      .forEach(m => {
        expect(poolOf(m.teamA)).toBe(m.pool);
        expect(poolOf(m.teamB)).toBe(m.pool);
      });
  });

  it('only ever names real team ids', () => {
    const known = new Set(TEAMS_2026.map(t => t.id));
    SCHEDULE_2026.forEach(m => {
      [m.teamA, m.teamB].filter(Boolean).forEach(id => expect(known.has(id)).toBe(true));
    });
  });

  it('groups by date for rendering, in published grid order', () => {
    expect(SCHEDULE_BY_DATE.map(d => d.date)).toEqual([
      '2026-09-12', '2026-09-19', '2026-09-20', '2026-09-26', '2026-10-03', '2026-10-04'
    ]);
    expect(SCHEDULE_BY_DATE[0].pools.map(p => p.pool)).toEqual(['Pool A', 'Pool B']);
    expect(SCHEDULE_BY_DATE.find(d => d.date === '2026-09-20').tentative).toBe(true);
    expect(SCHEDULE_BY_DATE.find(d => d.date === '2026-10-04').pools).toBeNull();
  });

  it('scheduleTeam returns null for a TBD slot', () => {
    expect(scheduleTeam(null)).toBeNull();
  });
});
