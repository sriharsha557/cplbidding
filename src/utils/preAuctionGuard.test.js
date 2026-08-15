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
