import { splitOutPreAuctionPlayers } from './preAuctionGuard';

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
