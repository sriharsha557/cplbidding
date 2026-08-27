import { CPL_2026 } from './cpl2026';

test('auction budget is 1000 coins', () => {
  expect(CPL_2026.auctionBudget).toBe(1000);
});

test('max bid per category matches the published rules', () => {
  expect(CPL_2026.maxBidByCategory).toEqual({
    Batsman: 250,
    Bowler: 250,
    'All-rounder': 350,
    WicketKeeper: 150
  });
});

test('pre-auction slots total five', () => {
  const { captain, viceCaptain, retainedOrTraded, total } = CPL_2026.preAuctionSlots;
  expect(captain + viceCaptain + retainedOrTraded).toBe(total);
  expect(total).toBe(5);
});

test('every max bid fits inside the total budget', () => {
  Object.values(CPL_2026.maxBidByCategory).forEach(max => {
    expect(max).toBeLessThan(CPL_2026.auctionBudget);
  });
});

describe('category budgets are rebased on the 2026 budget', () => {
  it('category caps sum to the auction budget, not the 2025 total of 1200', () => {
    const total = Object.values(CPL_2026.maxBidByCategory).reduce((a, b) => a + b, 0);
    expect(total).toBe(CPL_2026.auctionBudget);
    expect(total).not.toBe(1200);
  });

  it('no longer carries the stale advisory spend split', () => {
    expect(CPL_2026.advisoryCategorySpend).toBeUndefined();
  });
});

describe('squad size', () => {
  it('is 14 for 2026', () => {
    expect(CPL_2026.defaultSquadSize).toBe(14);
  });

  it('leaves nine places to be won at the auction', () => {
    expect(CPL_2026.defaultSquadSize - CPL_2026.preAuctionSlots.total).toBe(9);
  });

  it('can still satisfy every category minimum', () => {
    const { CPL_CATEGORY_BUDGETS } = require('../utils/auctionUtils');
    const minTotal = Object.values(CPL_CATEGORY_BUDGETS).reduce((s, b) => s + b.minPlayers, 0);
    expect(minTotal).toBeLessThanOrEqual(CPL_2026.defaultSquadSize);
  });
});
