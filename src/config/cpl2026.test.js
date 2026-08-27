import { CPL_2026 } from './cpl2026';

test('auction budget is 1000 coins', () => {
  expect(CPL_2026.auctionBudget).toBe(1000);
});

test('the flat per-player bid cap is 350 coins', () => {
  expect(CPL_2026.maxBidPerPlayer).toBe(350);
});

test('the cap fits inside the total budget', () => {
  expect(CPL_2026.maxBidPerPlayer).toBeLessThan(CPL_2026.auctionBudget);
});

test('there are no per-category budgets', () => {
  expect(CPL_2026.maxBidByCategory).toBeUndefined();
  expect(CPL_2026.advisoryCategorySpend).toBeUndefined();
});

test('pre-auction slots total five', () => {
  const { captain, viceCaptain, retainedOrTraded, total } = CPL_2026.preAuctionSlots;
  expect(captain + viceCaptain + retainedOrTraded).toBe(total);
  expect(total).toBe(5);
});

describe('squad size', () => {
  it('is 14 for 2026', () => {
    expect(CPL_2026.defaultSquadSize).toBe(14);
  });

  it('leaves nine places to be won at the auction', () => {
    expect(CPL_2026.defaultSquadSize - CPL_2026.preAuctionSlots.total).toBe(9);
  });

  it('can still satisfy every category minimum', () => {
    const { CATEGORY_SHAPE } = require('../utils/auctionUtils');
    const minTotal = Object.values(CATEGORY_SHAPE).reduce((s, b) => s + b.minPlayers, 0);
    expect(minTotal).toBeLessThanOrEqual(CPL_2026.defaultSquadSize);
  });
});
