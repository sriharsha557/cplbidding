import { maxBidFor, validateBid, needsWicketKeeper } from './bidRules';

const team = (overrides = {}) => ({
  tokensLeft: 1000,
  maxSquadSize: 15,
  squad: [],
  roleCount: { Batsman: 0, Bowler: 0, WicketKeeper: 0, 'All-rounder': 0 },
  ...overrides
});

test('max bid comes from the published category limits', () => {
  expect(maxBidFor('WicketKeeper')).toBe(150);
  expect(maxBidFor('Batsman')).toBe(250);
  expect(maxBidFor('Bowler')).toBe(250);
  expect(maxBidFor('All-rounder')).toBe(350);
});

test('a bid at the category maximum is allowed', () => {
  expect(validateBid(team(), 'Batsman', 250).valid).toBe(true);
});

test('a bid one coin over the category maximum is rejected', () => {
  const result = validateBid(team(), 'Batsman', 251);
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/250/);
});

test('a wicket keeper cannot exceed 150 even with a full purse', () => {
  const result = validateBid(team(), 'WicketKeeper', 200);
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/150/);
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

test('category spend caps never block a bid', () => {
  const overspent = team({
    categoryBudgets: { Batsman: { spent: 999, remaining: -999, max: 420 } }
  });
  expect(validateBid(overspent, 'Batsman', 250).valid).toBe(true);
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
