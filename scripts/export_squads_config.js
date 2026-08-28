#!/usr/bin/env node
/**
 * Builds src/config/squads2026.js — the final eight squads for the public
 * league page — and regenerates the apply/verify SQL, all from the one
 * hand-checked source of truth:
 *
 *   data/auction_log_2026.csv   player_id,team_name,sold_price
 *   (the 67 auction buys plus any unsold player attached to a team)
 *
 * Names, roles, photos and pre-auction roles come from the two upload
 * workbooks the auction was loaded from:
 *
 *   data/CPL_2026_PreAuction_Template.xlsx  "PreAuction"  (40 retained)
 *   data/CPL_2026_AuctionPlayers.xlsx       "Players"     (67 pool)
 *
 *   node scripts/export_squads_config.js
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const BUDGET = 1000;
const CSV = path.join('data', 'auction_log_2026.csv');
const PRE_AUCTION = path.join('data', 'CPL_2026_PreAuction_Template.xlsx');
const POOL = path.join('data', 'CPL_2026_AuctionPlayers.xlsx');
const CONFIG_OUT = path.join('src', 'config', 'squads2026.js');
const SQL_OUT = path.join('sql', '2026_apply_auction_log.sql');
const VERIFY_OUT = path.join('sql', '2026_verify_auction_log.sql');

/** Sheet team_name -> team id, canonical order. Mirrors src/config/teams2026.js. */
const TEAMS = [
  ['CPL_T01', 'Avengers'], ['CPL_T02', 'Fearless Falcons'], ['CPL_T03', 'Hits & Misses'],
  ['CPL_T04', 'Mavericks'], ['CPL_T05', 'Quality Strikers'], ['CPL_T06', 'Pirates'],
  ['CPL_T07', 'CSK'], ['CPL_T08', 'Digititans']
];
const idByName = new Map(TEAMS.map(([id, name]) => [name, id]));

/**
 * Players in the log but in neither workbook.
 *
 * 4YVM "Chandra Sekhar" was held out of the auction insert on a name clash with
 * Fearless Falcons VC "Chandra Sekhar Gubbala" (2X2H). They are two different
 * people with different employee IDs — 4YVM went unsold and was attached to
 * Pirates at base price, so he needs a row of his own here and in the database.
 */
const MANUAL_PLAYERS = {
  '4yvm': { name: 'Chandra Sekhar', role: 'Batsman', photo: '4YVM.jpg', baseTokens: 35 }
};

const key = s => String(s).trim().toLowerCase();
const sheet = (file, name) => XLSX.utils.sheet_to_json(XLSX.readFile(file).Sheets[name], { defval: '' });

// --- read the auction log ---
const log = fs.readFileSync(CSV, 'utf8').trim().split(/\r?\n/).slice(1).map(line => {
  const [player_id, team_name, sold_price] = line.split(',');
  return { id: player_id.trim(), team: team_name.trim(), price: Number(sold_price) };
});

// --- player reference data ---
const pre = sheet(PRE_AUCTION, 'PreAuction');
const pool = sheet(POOL, 'Players');
const refById = new Map();
pre.forEach(r => refById.set(key(r.PlayerID), {
  name: r.Name, role: r.Role, photo: r.PhotoFileName || '', preAuctionRole: r.PreAuctionRole
}));
pool.forEach(r => { if (!refById.has(key(r.PlayerID))) refById.set(key(r.PlayerID), {
  name: r.Name, role: r.Role, photo: r.PhotoFileName || ''
}); });
Object.entries(MANUAL_PLAYERS).forEach(([id, p]) => { if (!refById.has(id)) refById.set(id, p); });

const problems = [];
const warnings = [];

// --- assemble squads ---
const squads = {};
TEAMS.forEach(([id, teamName]) => {
  const retained = pre
    .filter(r => key(r.TeamName) === key(teamName))
    .map(r => ({
      playerId: String(r.PlayerID), name: r.Name, role: r.Role,
      photo: r.PhotoFileName || '', preAuctionRole: r.PreAuctionRole
    }));

  const bought = log
    .filter(s => key(s.team) === key(teamName))
    .map(s => {
      const ref = refById.get(key(s.id));
      if (!ref) problems.push(`${s.id} (${teamName}): not in either workbook`);
      return {
        playerId: s.id, name: ref ? ref.name : s.id, role: ref ? ref.role : '',
        photo: ref ? ref.photo : '', price: s.price
      };
    })
    .sort((a, b) => b.price - a.price);

  const spent = bought.reduce((sum, p) => sum + p.price, 0);
  const captains = retained.filter(p => p.preAuctionRole === 'Captain').length;
  const vcs = retained.filter(p => p.preAuctionRole === 'ViceCaptain').length;

  const size = retained.length + bought.length;
  if (retained.length !== 5) problems.push(`${teamName}: ${retained.length} retained, expected 5`);
  if (size > 14) problems.push(`${teamName}: squad of ${size}, over the 14 cap`);
  if (size < 14) warnings.push(`${teamName}: squad of ${size} (${14 - size} slot(s) unfilled)`);
  if (captains !== 1) problems.push(`${teamName}: ${captains} captains`);
  if (vcs !== 1) problems.push(`${teamName}: ${vcs} vice-captains`);
  if (spent > BUDGET) warnings.push(`${teamName}: spent ${spent}, OVER the ${BUDGET} budget — fix ${CSV}`);

  squads[id] = { teamId: id, teamName, retained, bought, spent, tokensLeft: BUDGET - spent };
});

const unknownTeams = log.filter(s => !idByName.has(s.team));
if (unknownTeams.length) problems.push(`unknown team names in CSV: ${[...new Set(unknownTeams.map(s => s.team))].join(', ')}`);

if (problems.length) {
  console.error('Problems (blocking):');
  problems.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}
if (warnings.length) {
  console.warn('Warnings (check the manual log):');
  warnings.forEach(w => console.warn(`  - ${w}`));
  console.warn('');
}

// --- write src/config/squads2026.js ---
const config = `/**
 * CPL 2026 final squads — generated, do NOT edit by hand.
 *
 *   node scripts/export_squads_config.js
 *
 * Source of truth: data/auction_log_2026.csv (the 67 auction buys) plus the two
 * upload workbooks for names/roles/photos. Keyed by team id (see teams2026.js).
 * retained[] holds the five pre-auction players (Captain, Vice-Captain, three
 * retained/traded); bought[] holds the nine auction wins, priciest first.
 */
export const SQUADS_2026 = ${JSON.stringify(squads, null, 2)};

/** All 14 players for a team id, retained first. */
export function squadFor(teamId) {
  const s = SQUADS_2026[teamId];
  return s ? [...s.retained, ...s.bought] : [];
}

export default SQUADS_2026;
`;
fs.writeFileSync(CONFIG_OUT, config, 'utf8');

// --- regenerate sql/2026_apply_auction_log.sql from the same CSV ---
const qs = s => `'${String(s).replace(/'/g, "''")}'`;
const valuesBlock = log.map(s => `    (${qs(s.id)}, ${qs(s.team)}, ${s.price})`).join(',\n');
const idBlock = log.map(s => `    (${qs(s.id)})`).join(',\n');
const sql = `-- CPL 2026: apply the manual auction log to the database.
-- Generated by scripts/export_squads_config.js from ${CSV}.
-- Run sql/2026_verify_auction_log.sql FIRST and confirm the results.
-- Re-runnable: step 3 fully recomputes every purse.

BEGIN;

-- 0. Players added outside the auction insert (see MANUAL_PLAYERS).
${Object.entries(MANUAL_PLAYERS).map(([id, p]) =>
  `INSERT INTO players (player_id, name, role, base_tokens, photo_filename, status)\n` +
  `VALUES (${qs(id.toUpperCase())}, ${qs(p.name)}, ${qs(p.role)}, ${p.baseTokens || 0}, ${p.photo ? qs(p.photo) : 'NULL'}, 'Available')\n` +
  `ON CONFLICT (player_id) DO NOTHING;`).join('\n')}

-- 1. Mark every logged player Sold to the right team at the logged price.
WITH log (player_id, team_name, sold_price) AS (
  VALUES
${valuesBlock}
)
UPDATE players p
SET status = 'Sold', sold_to = l.team_name, sold_price = l.sold_price
FROM log l
WHERE lower(p.player_id) = lower(l.player_id);

-- 2. Any auction player NOT in the log goes back to Available.
--    Pre-auction players (status 'PreAuction') are left untouched.
WITH log (player_id) AS (
  VALUES
${idBlock}
)
UPDATE players p
SET status = 'Available', sold_to = NULL, sold_price = 0
WHERE p.status = 'Sold'
  AND lower(p.player_id) NOT IN (SELECT lower(player_id) FROM log);

-- 3. Rebuild every team's purse from actual spend (${BUDGET} = auction budget).
UPDATE teams t
SET tokens_left = ${BUDGET} - COALESCE((
      SELECT SUM(p.sold_price) FROM players p
      WHERE p.sold_to = t.team_name AND p.status = 'Sold'
    ), 0);

-- 4. Result before commit.
SELECT t.team_name, t.tokens_left, ${BUDGET} - t.tokens_left AS spent,
       COUNT(p.player_id) FILTER (WHERE p.status = 'Sold') AS sold_count
FROM teams t LEFT JOIN players p ON p.sold_to = t.team_name
GROUP BY t.team_name, t.tokens_left
ORDER BY t.team_name;

COMMIT;
`;
fs.writeFileSync(SQL_OUT, sql, 'utf8');

// --- regenerate sql/2026_verify_auction_log.sql (read-only checks) ---
const perTeam = {};
log.forEach(s => { perTeam[s.team] = (perTeam[s.team] || 0) + s.price; });
TEAMS.forEach(([, name]) => { if (!(name in perTeam)) perTeam[name] = 0; });
const verify = `-- CPL 2026 auction log verification (READ ONLY -- no writes, no COMMIT).
-- Generated by scripts/export_squads_config.js from ${CSV}.
-- Compares the live database against data/auction_log_2026.csv. Nothing changes
-- until you run sql/2026_apply_auction_log.sql.

WITH log (player_id, team_name, sold_price) AS (
  VALUES
${valuesBlock}
),
db AS (SELECT lower(player_id) AS k, player_id, name, status, sold_to, sold_price FROM players)
-- 1. Row by row: the log vs the database
SELECT
  COALESCE(l.player_id, d.player_id)              AS player_id,
  d.name,
  l.team_name                                    AS log_team,
  d.sold_to                                      AS db_team,
  l.sold_price                                   AS log_price,
  d.sold_price                                   AS db_price,
  d.status                                       AS db_status,
  CASE
    WHEN l.player_id IS NULL AND d.status = 'Sold'   THEN 'IN DB, NOT IN LOG'
    WHEN d.k IS NULL                                 THEN 'IN LOG, NOT IN DB'
    WHEN d.status <> 'Sold'                          THEN 'NOT MARKED SOLD'
    WHEN d.sold_to IS DISTINCT FROM l.team_name      THEN 'WRONG TEAM'
    WHEN d.sold_price IS DISTINCT FROM l.sold_price  THEN 'WRONG PRICE'
    ELSE 'ok'
  END                                            AS verdict
FROM log l
FULL OUTER JOIN db d ON d.k = lower(l.player_id)
WHERE l.player_id IS NOT NULL OR d.status = 'Sold'
ORDER BY verdict <> 'ok' DESC, log_team, player_id;

-- 2. Per-team purse: log vs live
WITH expected (team_name, spend, tokens_left) AS (
  VALUES
${TEAMS.map(([, name]) => `    (${qs(name)}, ${perTeam[name]}, ${BUDGET - perTeam[name]})`).join(',\n')}
)
SELECT
  e.team_name, e.spend AS log_spend, e.tokens_left AS log_tokens_left,
  t.tokens_left AS db_tokens_left, ${BUDGET} - t.tokens_left AS db_spend,
  (SELECT COUNT(*) FROM players p WHERE p.sold_to = e.team_name AND p.status = 'Sold') AS db_sold_count,
  CASE WHEN e.spend > ${BUDGET} THEN 'LOG OVER ${BUDGET}'
       WHEN t.tokens_left = e.tokens_left THEN 'ok' ELSE 'MISMATCH' END AS verdict
FROM expected e JOIN teams t ON t.team_name = e.team_name
ORDER BY verdict <> 'ok' DESC, e.team_name;
`;
fs.writeFileSync(VERIFY_OUT, verify, 'utf8');

console.log(`Wrote ${CONFIG_OUT}`);
console.log(`Wrote ${SQL_OUT}`);
console.log(`Wrote ${VERIFY_OUT}`);
TEAMS.forEach(([id, name]) => {
  const s = squads[id];
  console.log(`  ${name.padEnd(17)} ${s.retained.length}+${s.bought.length} players  spent ${String(s.spent).padStart(4)}  left ${s.tokensLeft}`);
});
