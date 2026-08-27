-- Returns the auction pool to a biddable state.
--
-- A reset left every pool player as 'Unsold'. The pool insert uses
-- ON CONFLICT DO NOTHING, so re-running it will not revive them and the
-- auction would open with no players available.
--
-- Touches only players who are not on a pre-auction squad, so retained
-- players keep status 'PreAuction' and their sold_to.
--
-- Run AFTER the cleanup and the two inserts. Safe to re-run.

UPDATE players
SET status     = 'Available',
    sold_to    = NULL,
    sold_price = 0
WHERE (pre_auction_role IS NULL OR pre_auction_role = '')
  AND status <> 'Available';
