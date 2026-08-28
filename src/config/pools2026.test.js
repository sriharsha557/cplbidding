import { POOLS_2026, poolOf, poolTeams } from './pools2026';
import { TEAMS_2026 } from './teams2026';

describe('POOLS_2026', () => {
  const ids = Object.values(POOLS_2026).flat();

  it('has two pools of four', () => {
    expect(Object.keys(POOLS_2026)).toEqual(['Pool A', 'Pool B']);
    Object.values(POOLS_2026).forEach(pool => expect(pool).toHaveLength(4));
  });

  it('places every team exactly once', () => {
    const teamIds = TEAMS_2026.map(t => t.id).sort();
    expect([...ids].sort()).toEqual(teamIds);
  });

  it('references only real team ids', () => {
    const known = new Set(TEAMS_2026.map(t => t.id));
    ids.forEach(id => expect(known.has(id)).toBe(true));
  });

  it('poolOf resolves a team to its pool and unknowns to null', () => {
    expect(poolOf(POOLS_2026['Pool A'][0])).toBe('Pool A');
    expect(poolOf('CPL_T99')).toBeNull();
  });

  it('poolTeams returns team objects in seeded order', () => {
    const teams = poolTeams('Pool B');
    expect(teams.map(t => t.id)).toEqual(POOLS_2026['Pool B']);
  });
});
