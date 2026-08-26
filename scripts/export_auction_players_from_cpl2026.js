#!/usr/bin/env node
/**
 * Builds the auction-pool upload from CPL2026.xlsx "Auction Players".
 *
 * The sheet has 65 rows, six of which are entirely blank, leaving 59 real
 * registrations. Blank rows are dropped rather than exported as empty players.
 *
 * Emits two interchangeable artefacts:
 *   data/CPL_2026_AuctionPlayers.xlsx   for the admin Excel upload
 *   sql/2026_auction_players_insert.sql for running directly against Supabase
 *
 * Load ONE of them, not both. The SQL is idempotent (ON CONFLICT DO NOTHING),
 * the Excel path is not.
 *
 *   node scripts/export_auction_players_from_cpl2026.js
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/** Registration workbook. Pass a different one as the first argument. */
const SOURCE = process.argv[2] || 'CPL2026.xlsx';

/**
 * Fallback for "Base Token" if a future SOURCE arrives without the column.
 *
 * Kept as a safety net: a fresh form export drops the hand-added ranking, and
 * silently reverting to role defaults is what produced the random ordering
 * owners complained about. Prefer scripts/merge_registrations.js, which folds
 * new registrations into CPL2026.xlsx and keeps the column.
 */
const RANKING_SOURCE = 'CPL2026.xlsx';
const PHOTO_DIR = path.join('public', 'players');
const PRE_AUCTION = path.join('data', 'CPL_2026_PreAuction_Template.xlsx');
const XLSX_OUT = path.join('data', 'CPL_2026_AuctionPlayers.xlsx');
const SQL_OUT = path.join('sql', '2026_auction_players_insert.sql');

/**
 * Registration wording -> the four roles the players.role CHECK constraint
 * allows. Both all-rounder variants collapse to All-rounder.
 */
const ROLE_MAP = {
  'batsman': 'Batsman',
  'bowler': 'Bowler',
  'batting all-rounder': 'All-rounder',
  'bowling all-rounder': 'All-rounder',
  'all-rounder': 'All-rounder',
  'allrounder': 'All-rounder',
  'all rounder': 'All-rounder',
  'wicket keeper': 'WicketKeeper',
  'wicketkeeper': 'WicketKeeper',
  'wicket-keeper': 'WicketKeeper',
  'keeper': 'WicketKeeper'
};

/**
 * Fallback opening price by role, used only where "Base Token" is blank in the
 * sheet. A filled value always wins.
 *
 * BaseTokens doubles as the auction running order: sortPlayersByAuctionOrder
 * sorts by role, then by BaseTokens descending, so a higher value brings a
 * player up earlier within their category. Leaving the column blank ties every
 * player at the default, and a stable sort then falls back to registration
 * order — which is the "random order" the owners noticed.
 */
const BASE_TOKENS = { Batsman: 35, Bowler: 35, 'All-rounder': 40, WicketKeeper: 35 };

/**
 * Employee IDs corrected after registration, keyed by the value in the sheet.
 * Applied here rather than by editing CPL2026.xlsx, which is re-sent as
 * registrations come in and whose Retained sheet would lose its layout if
 * rewritten. Fix the source sheet too when convenient; this map is harmless
 * once the sheet agrees.
 */
const ID_CORRECTIONS = { PRCHI: '399x' };

/**
 * Registrations that must not enter the auction, keyed by Employee ID.
 *
 * 4YVM "Chandra Sekhar" is the same person as 2X2H "Chandra Sekhar Gubbala",
 * already locked in as Fearless Falcons Vice-Captain, registered again under a
 * second ID. The differing IDs mean neither the UNIQUE constraint nor the
 * pre-auction guard would have caught it, and he would have been auctioned
 * while already on a squad.
 */
const EXCLUDED_IDS = {
  '4YVM': 'already retained as Fearless Falcons Vice-Captain (2X2H)'
};

const TEAMS = [
  { TeamID: 'CPL_T01', TeamName: 'Avengers',         LogoFile: 'Avengers.png' },
  { TeamID: 'CPL_T02', TeamName: 'Fearless Falcons', LogoFile: 'Feralessfalcons.png' },
  { TeamID: 'CPL_T03', TeamName: 'Hits & Misses',    LogoFile: 'HitsMisses.png' },
  { TeamID: 'CPL_T04', TeamName: 'Mavericks',        LogoFile: 'Mavericks.png' },
  { TeamID: 'CPL_T05', TeamName: 'Quality Strikers', LogoFile: 'quality_strikers.png' },
  { TeamID: 'CPL_T06', TeamName: 'Pirates',          LogoFile: 'Pirates.png' },
  { TeamID: 'CPL_T07', TeamName: 'CSK',              LogoFile: 'csk.png' },
  { TeamID: 'CPL_T08', TeamName: 'Digititans',       LogoFile: 'digititans.png' }
];

const photos = new Map(fs.readdirSync(PHOTO_DIR).map(f => [f.toLowerCase(), f]));
const sqlString = value => (value === null || value === '' ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`);

const rows = XLSX.utils
  .sheet_to_json(XLSX.readFile(SOURCE).Sheets['Auction Players'], { defval: '' })
  .filter(r => String(r['Full Name']).trim() !== '');

/**
 * Anyone already on a pre-auction squad, by Employee ID and by name.
 *
 * Only players not already retained belong in the auction. The name check
 * matters as much as the ID: 4YVM registered under a second Employee ID while
 * already locked in as a Vice-Captain, so an ID-only check let him through.
 */
const retainedById = new Set();
const retainedByName = new Map();
const nameKey = v => String(v).toLowerCase().replace(/[^a-z]/g, '');
XLSX.utils
  .sheet_to_json(XLSX.readFile(PRE_AUCTION).Sheets.PreAuction, { defval: '' })
  .forEach(r => {
    if (r.PlayerID) retainedById.add(String(r.PlayerID).trim().toLowerCase());
    if (r.Name) retainedByName.set(nameKey(r.Name), `${r.Name} (${r.TeamName})`);
  });

/** Loose name match: "Chandra Sekhar" against "Chandra Sekhar Gubbala". */
const retainedMatch = name => {
  const key = nameKey(name);
  if (retainedByName.has(key)) return retainedByName.get(key);
  for (const [k, label] of retainedByName) {
    if (k.startsWith(key) || key.startsWith(k)) return label;
  }
  return null;
};

const excluded = [];
const eligible = rows.filter(r => {
  const id = String(r['Employee ID']).trim();
  const name = String(r['Full Name']).trim();
  const reason = EXCLUDED_IDS[id] || EXCLUDED_IDS[id.toUpperCase()];
  if (reason) {
    excluded.push(`${id} ${name} — ${reason}`);
    return false;
  }
  if (retainedById.has(id.toLowerCase())) {
    excluded.push(`${id} ${name} — already retained (matched on Employee ID)`);
    return false;
  }
  const retained = retainedMatch(name);
  if (retained) {
    excluded.push(`${id} ${name} — already retained as ${retained} (matched on name)`);
    return false;
  }
  return true;
});

const sourceHasRanking = eligible.length > 0 && 'Base Token' in eligible[0];

/** Employee ID -> Base Token, from whichever workbook carries the column. */
const carriedRanking = new Map();
if (!sourceHasRanking && fs.existsSync(RANKING_SOURCE)) {
  XLSX.utils
    .sheet_to_json(XLSX.readFile(RANKING_SOURCE).Sheets['Auction Players'], { defval: '' })
    .forEach(r => {
      const id = String(r['Employee ID']).trim().toLowerCase();
      const token = String(r['Base Token'] === undefined ? '' : r['Base Token']).trim();
      if (id && token) carriedRanking.set(id, token);
    });
}

const problems = [];
const unranked = [];
const players = eligible.map((r, i) => {
  const name = String(r['Full Name']).trim();
  const rawId = String(r['Employee ID']).trim();
  const playerId = ID_CORRECTIONS[rawId] || rawId;
  const preferred = String(r['Preferred Role']).trim().toLowerCase();
  const role = ROLE_MAP[preferred];

  if (!playerId) problems.push(`${name}: no Employee ID`);
  if (!role) problems.push(`${name}: unmapped Preferred Role "${r['Preferred Role']}"`);

  // "Base Token" is the hand-assigned tier; blanks fall back to the role default.
  const declared = sourceHasRanking
    ? String(r['Base Token'] === undefined ? '' : r['Base Token']).trim()
    : (carriedRanking.get(playerId.toLowerCase()) || carriedRanking.get(rawId.toLowerCase()) || '');
  if (declared && Number.isNaN(Number(declared))) {
    problems.push(`${name}: Base Token "${declared}" is not a number`);
  }
  const baseTokens = declared && !Number.isNaN(Number(declared))
    ? Number(declared)
    : (role ? BASE_TOKENS[role] : '');
  if (!declared) unranked.push(`${name} (${role || '?'})`);

  const photo = photos.get(`${playerId.toLowerCase()}.jpg`) || '';
  return {
    PlayerID: playerId,
    Name: name,
    Role: role || '',
    BaseTokens: baseTokens,
    PhotoFileName: photo,
    Department: '',
    Comments: String(r.Comments || '').trim(),
    Status: 'Available',
    AuctionOrder: i + 1
  };
});

const duplicates = players
  .map(p => p.PlayerID)
  .filter((id, i, all) => id && all.indexOf(id) !== i);
if (duplicates.length) problems.push(`duplicate Employee IDs: ${[...new Set(duplicates)].join(', ')}`);

if (problems.length) {
  console.error('Cannot export:');
  problems.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(players), 'Players');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(TEAMS), 'Teams');
XLSX.writeFile(wb, XLSX_OUT);

const values = players.map(p => `  (${[
  sqlString(p.PlayerID), sqlString(p.Name), sqlString(p.Role), p.BaseTokens,
  sqlString(p.PhotoFileName || null), 'NULL', p.AuctionOrder, `'Available'`, 'NULL', '0', 'false', 'false',
  sqlString(p.Comments || null)
].join(', ')})`).join(',\n');

fs.writeFileSync(SQL_OUT, `-- CPL 2026 auction pool: ${players.length} players.
-- Generated by scripts/export_auction_players_from_cpl2026.js from ${SOURCE}.
-- Do NOT also run the Excel upload for these players; pick one route.
-- Safe to re-run: existing player_id rows are left untouched.

INSERT INTO players (
  player_id, name, role, base_tokens, photo_filename, department,
  auction_order, status, sold_to, sold_price, is_captain, is_vice_captain,
  comments
) VALUES
${values}
ON CONFLICT (player_id) DO NOTHING;
`, 'utf8');

const byRole = players.reduce((acc, p) => ({ ...acc, [p.Role]: (acc[p.Role] || 0) + 1 }), {});
console.log(`Source: ${SOURCE}`);
if (excluded.length) {
  console.log(`  excluded ${excluded.length} registration(s):`);
  excluded.forEach(e => console.log(`    - ${e}`));
}
if (!sourceHasRanking) {
  console.log(`  no "Base Token" column — carried ${carriedRanking.size} rankings forward from ${RANKING_SOURCE}`);
}
console.log(`Wrote ${XLSX_OUT} and ${SQL_OUT}`);
console.log(`  ${players.filter(p => p.Comments).length} with comments`);
console.log(`  ${players.length} players: ${Object.entries(byRole).map(([r, n]) => `${r} ${n}`).join(', ')}`);
console.log(`  ${players.filter(p => p.PhotoFileName).length} with photos, ${players.filter(p => !p.PhotoFileName).length} without`);

if (unranked.length) {
  console.log(`
  ${unranked.length} have no Base Token and sit at the role default,`);
  console.log('  so they auction in registration order behind the ranked players:');
  unranked.forEach(u => console.log(`    - ${u}`));
}
