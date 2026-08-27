-- Returns the auction pool to a biddable state.
--
-- A reset left every pool player as 'Unsold'. The pool insert uses
-- ON CONFLICT DO NOTHING, so re-running it will not revive them and the
-- auction would open with no players available.
--
-- Two guards, because the stale case-duplicate rows carry no pre_auction_role
-- and would otherwise be swept into the pool as playable copies of retained
-- players:
--   * skip anyone holding a pre_auction_role
--   * skip anyone whose id matches a PreAuction player ignoring case
-- The second makes this safe even if the cleanup has not been run yet.
--
-- Safe to re-run.

UPDATE players p
SET status     = 'Available',
    sold_to    = NULL,
    sold_price = 0
WHERE (p.pre_auction_role IS NULL OR p.pre_auction_role = '')
  AND p.status <> 'Available'
  AND NOT EXISTS (
    SELECT 1 FROM players q
    WHERE lower(q.player_id) = lower(p.player_id)
      AND q.player_id <> p.player_id
      AND q.status = 'PreAuction'
  );
