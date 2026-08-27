-- Removes rows left behind by earlier loads. Run before the inserts.
--
-- Two kinds of stale row:
--
-- 1. Wrong or duplicate registrations
--    4YVM  "Chandra Sekhar" is 2X2H "Chandra Sekhar Gubbala", Fearless Falcons
--          Vice-Captain, who registered twice under different Employee IDs.
--    PRCHI "Pranay Chintamani" is a mistyped id; the correct row is 399x.
--
-- 2. Case duplicates
--    patch_preauction_template.js corrected several PlayerIDs to upper case,
--    but players.player_id is case-sensitive, so the upsert inserted new rows
--    beside the old lower-case ones instead of updating them. That is why
--    Pirates showed six retained players. The upper-case row is the current
--    one; these lower-case rows are the leftovers.
--
-- Never deletes a player who was actually sold. Safe to re-run.

DELETE FROM players
WHERE player_id IN (
  '4YVM', 'PRCHI',
  '61ex', '628b', 'cqx4', 'mpb8', '6ljx', 'cnc0'
)
AND status IS DISTINCT FROM 'Sold';
