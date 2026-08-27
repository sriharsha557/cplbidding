import { maxBidFor, validateBid, needsWicketKeeper } from './bidRules';

const team = (overrides = {}) => ({
  tokensLeft: 1000,
  maxSquadSize: 15,
  squad: [],
  roleCount: { Batsman: 0, Bowler: 0, WicketKeeper: 0, 'All-rounder': 0 },
  ...overrides
});

test('the bid cap is a flat 350 for every role', () => {
  expect(maxBidFor('WicketKeeper')).toBe(350);
  expect(maxBidFor('Batsman')).toBe(350);
  expect(maxBidFor('Bowler')).toBe(350);
  expect(maxBidFor('All-rounder')).toBe(350);
});

test('a bid at the cap is allowed', () => {
  expect(validateBid(team(), 'Batsman', 350).valid).toBe(true);
});

test('a bid one coin over the cap is rejected', () => {
  const result = validateBid(team(), 'Batsman', 351);
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/350/);
});

test('a wicket keeper can now go above the old 150 category cap', () => {
  expect(validateBid(team(), 'WicketKeeper', 300).valid).toBe(true);
});

test('no bid may exceed 350 even with a full purse', () => {
  const result = validateBid(team(), 'WicketKeeper', 400);
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/350/);
});

test('a bid above the remaining purse is rejected', () => {
  const result = validateBid(team({ tokensLeft: 40 }), 'Batsman', 50);
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/purse|coins/i);
});

test('a full squad is rejected', () => {
  const full = team({ squad: new Array(15).fill({}), maxSquadSize: 15 });
  const result = validateBid(full, 'Batsman', 10);
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/squad/i);
});

test('a NaN price (cleared bid field) is rejected', () => {
  const result = validateBid(team(), 'Batsman', NaN);
  expect(result.valid).toBe(false);
});

test('an undefined price is rejected', () => {
  const result = validateBid(team(), 'Batsman', undefined);
  expect(result.valid).toBe(false);
});

test('a zero price is rejected', () => {
  const result = validateBid(team(), 'Batsman', 0);
  expect(result.valid).toBe(false);
});

test('a negative price is rejected', () => {
  const result = validateBid(team(), 'Batsman', -10);
  expect(result.valid).toBe(false);
});

test('how much a team has already spent on a role never blocks a bid', () => {
  const heavyOnBatsmen = team({
    squad: new Array(4).fill({ Role: 'Batsman', BidPrice: 300 })
  });
  expect(validateBid(heavyOnBatsmen, 'Batsman', 250).valid).toBe(true);
});

test('a team with no keeper and one slot left needs a keeper', () => {
  const t = team({ squad: new Array(14).fill({}), maxSquadSize: 15 });
  expect(needsWicketKeeper(t)).toBe(true);
});

test('a team that already has a keeper does not need one', () => {
  const t = team({
    squad: new Array(14).fill({}),
    maxSquadSize: 15,
    roleCount: { Batsman: 0, Bowler: 0, WicketKeeper: 1, 'All-rounder': 0 }
  });
  expect(needsWicketKeeper(t)).toBe(false);
});

test('a team with plenty of slots left does not trigger the warning', () => {
  expect(needsWicketKeeper(team({ squad: new Array(5).fill({}) }))).toBe(false);
});

describe('CATEGORY_SHAPE is advisory squad guidance only', () => {
  const { CATEGORY_SHAPE } = require('./auctionUtils');
  const { CPL_2026 } = require('../config/cpl2026');

  it('carries no budget figures', () => {
    Object.values(CATEGORY_SHAPE).forEach(shape => {
      expect(shape.max).toBeUndefined();
      expect(shape.min).toBeUndefined();
    });
  });

  it('does not demand more wicket-keepers than the rules require', () => {
    expect(CATEGORY_SHAPE.WicketKeeper.minPlayers).toBe(CPL_2026.minWicketKeepers);
  });
});
