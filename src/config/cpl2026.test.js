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
