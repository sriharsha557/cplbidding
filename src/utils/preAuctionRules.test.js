import { validatePreAuctionUpload, normalizePreAuctionRows } from './preAuctionRules';

const teams = [
  { TeamID: 'CPL_T01', TeamName: 'Avengers', LogoFile: 'Avengers.png' },
  { TeamID: 'CPL_T06', TeamName: 'Pirates', LogoFile: 'Pirates.png' }
];

// Builds a valid five for one team.
const five = (team, idPrefix) => [
  { TeamName: team, PlayerID: idPrefix + '1', Name: 'A', Role: 'Batsman', BaseTokens: 100, PreAuctionRole: 'Captain', Availability: 'Available' },
  { TeamName: team, PlayerID: idPrefix + '2', Name: 'B', Role: 'Bowler', BaseTokens: 100, PreAuctionRole: 'ViceCaptain', Availability: 'Available' },
  { TeamName: team, PlayerID: idPrefix + '3', Name: 'C', Role: 'WicketKeeper', BaseTokens: 100, PreAuctionRole: 'Squad', Availability: 'Available' },
  { TeamName: team, PlayerID: idPrefix + '4', Name: 'D', Role: 'All-rounder', BaseTokens: 100, PreAuctionRole: 'Squad', Availability: 'Available' },
  { TeamName: team, PlayerID: idPrefix + '5', Name: 'E', Role: 'Batsman', BaseTokens: 100, PreAuctionRole: 'Squad', Availability: 'Available' }
];

const bothTeams = () => [...five('Avengers', 'AV'), ...five('Pirates', 'PI')];

test('a well-formed workbook passes', () => {
  const result = validatePreAuctionUpload(teams, bothTeams());
  expect(result.errors).toEqual([]);
  expect(result.valid).toBe(true);
});

test('a team with two captains fails', () => {
  const rows = bothTeams();
  rows[1].PreAuctionRole = 'Captain'; // Avengers now has 2 Captains, 0 ViceCaptain
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Avengers/);
  expect(result.errors.join(' ')).toMatch(/Captain/);
});

test('a team with only four players fails', () => {
  const rows = bothTeams().slice(1);
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Avengers/);
});

test('a duplicate PlayerID fails', () => {
  const rows = bothTeams();
  rows[5].PlayerID = 'AV1';
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/AV1/);
});

test('an unknown team name fails', () => {
  const rows = bothTeams();
  rows[0].TeamName = 'Nonexistent United';
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Nonexistent United/);
});

test('an invalid player role fails', () => {
  const rows = bothTeams();
  rows[0].Role = 'Allrounder'; // missing hyphen
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Allrounder/);
});

test('an invalid pre-auction role fails', () => {
  const rows = bothTeams();
  rows[2].PreAuctionRole = 'Retained';
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Retained/);
});

test('a missing BaseTokens fails', () => {
  const rows = bothTeams();
  delete rows[3].BaseTokens;
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/BaseTokens/);
});

test('unconfirmed availability warns but does not block', () => {
  const rows = bothTeams();
  rows[0].Availability = 'Unknown';
  rows[1].Availability = 'Unavailable';
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(true);
  expect(result.warnings).toHaveLength(2);
  expect(result.warnings.join(' ')).toMatch(/Avengers/);
});

test('a team present in Teams but absent from PreAuction fails', () => {
  const result = validatePreAuctionUpload(teams, five('Avengers', 'AV'));
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Pirates/);
});

test('normalize maps a Captain row to database columns', () => {
  const [row] = normalizePreAuctionRows([five('Avengers', 'AV')[0]]);
  expect(row).toEqual({
    player_id: 'AV1',
    name: 'A',
    role: 'Batsman',
    base_tokens: 100,
    photo_filename: null,
    department: null,
    availability: 'Available',
    pre_auction_role: 'Captain',
    sold_to: 'Avengers',
    sold_price: 0,
    status: 'PreAuction',
    is_captain: true,
    is_vice_captain: false
  });
});

test('normalize defaults availability to Unknown and mirrors ViceCaptain', () => {
  const source = five('Avengers', 'AV')[1];
  delete source.Availability;
  const [row] = normalizePreAuctionRows([source]);
  expect(row.availability).toBe('Unknown');
  expect(row.is_captain).toBe(false);
  expect(row.is_vice_captain).toBe(true);
});
