import { splitOutPreAuctionPlayers, filterAuctionPool } from './preAuctionGuard';

test('players already locked as PreAuction are held back', () => {
  const incoming = [
    { PlayerID: 'AV1', Name: 'A' },
    { PlayerID: 'NEW1', Name: 'N' }
  ];
  const locked = ['AV1'];

  const { safeToWrite, skipped } = splitOutPreAuctionPlayers(incoming, locked);

  expect(safeToWrite.map(p => p.PlayerID)).toEqual(['NEW1']);
  expect(skipped).toEqual(['AV1']);
});

test('nothing is held back when no players are locked', () => {
  const incoming = [{ PlayerID: 'NEW1', Name: 'N' }];
  const { safeToWrite, skipped } = splitOutPreAuctionPlayers(incoming, []);
  expect(safeToWrite).toHaveLength(1);
  expect(skipped).toEqual([]);
});

test('a numeric PlayerID from Excel matches a locked string player_id from the database', () => {
  // Excel parsing yields numbers; Supabase player_id rows are strings. Without
  // String() coercion on both sides this comparison silently fails and the
  // player is wrongly re-inserted, wiping their PreAuction status.
  const incoming = [
    { PlayerID: 123, Name: 'Numeric ID' },
    { PlayerID: 456, Name: 'Not locked' }
  ];
  const locked = ['123'];

  const { safeToWrite, skipped } = splitOutPreAuctionPlayers(incoming, locked);

  expect(safeToWrite.map(p => p.PlayerID)).toEqual([456]);
  expect(skipped).toEqual(['123']);
});

describe('filterAuctionPool', () => {
  // Regression test for the defect that would have ruined auction night: a
  // team's own Captain (status PreAuction, zero cost, already on the squad)
  // being drawn as a lot and put up for bidding.
  test('excludes every PreAuction player from the auction pool', () => {
    const players = [
      { PlayerID: 'AV1', Name: 'Captain', Status: 'PreAuction', SoldTo: 'Avengers' },
      { PlayerID: 'AV2', Name: 'ViceCaptain', Status: 'PreAuction', SoldTo: 'Avengers' },
      { PlayerID: 'AV3', Name: 'Squad1', Status: 'PreAuction', SoldTo: 'Avengers' },
      { PlayerID: 'N1', Name: 'Available Player', Status: 'Available' },
      { PlayerID: 'N2', Name: 'Sold Player', Status: 'Sold', SoldTo: 'Avengers' },
      { PlayerID: 'N3', Name: 'Unsold Player', Status: 'Unsold' }
    ];

    const pool = filterAuctionPool(players);

    expect(pool.map(p => p.PlayerID)).toEqual(['N1', 'N2', 'N3']);
    expect(pool.some(p => p.Status === 'PreAuction')).toBe(false);
  });

  test('an empty list stays empty', () => {
    expect(filterAuctionPool([])).toEqual([]);
  });

  test('a list with no PreAuction players is returned unchanged', () => {
    const players = [
      { PlayerID: 'N1', Status: 'Available' },
      { PlayerID: 'N2', Status: 'Unsold' }
    ];
    expect(filterAuctionPool(players)).toEqual(players);
  });
});
