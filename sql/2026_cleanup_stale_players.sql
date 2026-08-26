-- Removes rows left behind by earlier loads.
--
-- 4YVM  "Chandra Sekhar" — the same person as 2X2H "Chandra Sekhar Gubbala",
--       Fearless Falcons Vice-Captain, who registered twice under different
--       Employee IDs. Deleted from the source workbook; this clears the row an
--       earlier load already wrote.
-- PRCHI "Pranay Chintamani" — a mistyped Employee ID. The correct row is 399x,
--       so leaving this one in place lists him twice.
--
-- Deletes only these two ids, and only if they were never sold. Safe to re-run.

DELETE FROM players
WHERE player_id IN ('4YVM', 'PRCHI')
  AND (status IS DISTINCT FROM 'Sold');
