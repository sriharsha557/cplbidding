import { TEAMS_2026, OWNERSHIP, AUCTION_POOL_SIZE, daysUntilDeadline, ownershipProgress } from './teams2026';

describe('TEAMS_2026', () => {
  it('has all eight teams with unique ids and names', () => {
    expect(TEAMS_2026).toHaveLength(8);
    expect(new Set(TEAMS_2026.map(t => t.id)).size).toBe(8);
    expect(new Set(TEAMS_2026.map(t => t.name)).size).toBe(8);
  });

  it('names exactly one defending champion', () => {
    const champions = TEAMS_2026.filter(t => t.isDefendingChampion);
    expect(champions.map(t => t.name)).toEqual(['Digititans']);
  });

  it('keeps the canonical Supabase name separate from the display name', () => {
    const champion = TEAMS_2026.find(t => t.isDefendingChampion);
    expect(champion.name).toBe('Digititans');
    expect(champion.displayName).toBe('DIGI TITANS');
  });

  it('gives every team a logo, a display name and an owner', () => {
    TEAMS_2026.forEach(team => {
      expect(team.logo).toMatch(/^\/.+\.png$/);
      expect(team.displayName).toBeTruthy();
      expect(team.owner).toBeTruthy();
    });
  });

  it('uses the display names from CPL2026.xlsx', () => {
    const shown = TEAMS_2026.map(t => t.displayName).sort();
    expect(shown).toEqual([
      'Avengers XI', 'Colruyt Super Kings', 'DIGI TITANS', 'Fearless Falcons',
      'Hits & Misses', 'Mavericks', 'Pirates XI', 'Quality Strikers'
    ]);
  });

  it('keeps canonical Supabase names unchanged by the 2026 renames', () => {
    const canonical = TEAMS_2026.map(t => t.name).sort();
    expect(canonical).toEqual([
      'Avengers', 'CSK', 'Digititans', 'Fearless Falcons',
      'Hits & Misses', 'Mavericks', 'Pirates', 'Quality Strikers'
    ]);
  });

  it('publishes the registered auction pool size', () => {
    expect(AUCTION_POOL_SIZE).toBe(59);
  });
});

describe('daysUntilDeadline', () => {
  const deadline = '2026-08-24';

  it('counts whole days before the deadline', () => {
    expect(daysUntilDeadline(deadline, new Date(2026, 7, 19))).toBe(5);
  });

  it('returns 0 on the deadline day', () => {
    expect(daysUntilDeadline(deadline, new Date(2026, 7, 24))).toBe(0);
  });

  it('goes negative after the deadline so callers can show "closed"', () => {
    expect(daysUntilDeadline(deadline, new Date(2026, 7, 27))).toBe(-3);
  });

  it('ignores the time of day', () => {
    expect(daysUntilDeadline(deadline, new Date(2026, 7, 23, 23, 59))).toBe(1);
  });

  it('returns null for an unparseable deadline', () => {
    expect(daysUntilDeadline('not-a-date', new Date(2026, 7, 19))).toBeNull();
  });
});

describe('ownershipProgress', () => {
  it('reports the configured counts', () => {
    expect(ownershipProgress({ confirmed: 4, total: 8 })).toEqual({
      confirmed: 4, total: 8, pending: 4, isComplete: false
    });
  });

  it('clamps a confirmed count above the roster size', () => {
    expect(ownershipProgress({ confirmed: 9, total: 8 })).toMatchObject({ confirmed: 8, pending: 0, isComplete: true });
  });

  it('clamps a negative confirmed count', () => {
    expect(ownershipProgress({ confirmed: -2, total: 8 })).toMatchObject({ confirmed: 0, pending: 8 });
  });

  it('is not complete when there are no teams', () => {
    expect(ownershipProgress({ confirmed: 0, total: 0 }).isComplete).toBe(false);
  });

  it('defaults to the shipped ownership config', () => {
    expect(ownershipProgress()).toMatchObject({ confirmed: OWNERSHIP.confirmed, total: OWNERSHIP.total });
  });
});
