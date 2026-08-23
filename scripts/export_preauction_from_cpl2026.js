#!/usr/bin/env node
/**
 * Builds the pre-auction upload workbook from CPL2026.xlsx.
 *
 * CPL2026.xlsx "Retained" holds the five pre-auction players per team (Captain,
 * Vice-Captain and three retained/traded) but carries only their names. Role,
 * PlayerID, Department and PhotoFileName are recovered by matching those names
 * against CPL_Auction_Data_2025.xlsx "Complete_Data". Players new for 2026 have
 * no match, so their Role and PlayerID are left blank for a human to fill —
 * validatePreAuctionUpload rejects the sheet until they are.
 *
 * TeamName is written as the canonical Supabase value (teams.team_name), NOT the
 * 2026 display name: players.sold_to is a foreign key onto that column.
 *
 *   node scripts/export_preauction_from_cpl2026.js
 */
const XLSX = require('xlsx');
const path = require('path');

const SOURCE = 'CPL2026.xlsx';
const REFERENCE = 'assets/CPL_Auction_Data_2025.xlsx';
const OUTPUT = path.join('data', 'CPL_2026_PreAuction_Template.xlsx');

/** Sheet heading -> canonical Supabase team name, with its logo. */
const TEAMS = [
  { sheet: 'Mavericks',           TeamID: 'CPL_T04', TeamName: 'Mavericks',        LogoFile: 'Mavericks.png' },
  { sheet: 'Colruyt Super Kings', TeamID: 'CPL_T07', TeamName: 'CSK',              LogoFile: 'csk.png' },
  { sheet: 'Digi Titans',         TeamID: 'CPL_T08', TeamName: 'Digititans',       LogoFile: 'digititans.png' },
  { sheet: 'Avengers XI',         TeamID: 'CPL_T01', TeamName: 'Avengers',         LogoFile: 'Avengers.png' },
  { sheet: 'Quality Strickers',   TeamID: 'CPL_T05', TeamName: 'Quality Strikers', LogoFile: 'quality_strikers.png' },
  { sheet: 'Pirates XI',          TeamID: 'CPL_T06', TeamName: 'Pirates',          LogoFile: 'Pirates.png' },
  { sheet: 'Fearless Falcons',    TeamID: 'CPL_T02', TeamName: 'Fearless Falcons', LogoFile: 'Feralessfalcons.png' },
  { sheet: 'Hits & Misses',       TeamID: 'CPL_T03', TeamName: 'Hits & Misses',    LogoFile: 'HitsMisses.png' }
];

/** Strips the "( C )" / "( vc )" suffix and collapses whitespace. */
const stripMarker = value => String(value).replace(/\(\s*[cv]{1,2}\s*\)/gi, '').replace(/\s+/g, ' ').trim();

/** Loose key for name matching across workbooks: letters and single spaces. */
const nameKey = value => String(value).toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

/** Captain and Vice-Captain are marked inline; everyone else is Squad. */
function preAuctionRole(raw, indexInBlock) {
  if (/\(\s*vc\s*\)/i.test(raw)) return 'ViceCaptain';
  if (/\(\s*c\s*\)/i.test(raw)) return 'Captain';
  return indexInBlock === 0 ? 'Captain' : indexInBlock === 1 ? 'ViceCaptain' : 'Squad';
}

/** Locates each team's column in the two 4-team blocks of the Retained sheet. */
function readRetained(grid) {
  const found = [];
  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      const heading = stripMarker(cell);
      const team = TEAMS.find(t => t.sheet.toLowerCase() === heading.toLowerCase());
      if (team) found.push({ team, headerRow: r, col: c });
    });
  });

  return found.map(({ team, headerRow, col }) => {
    // Header, owner, "Players" label, then the five slots.
    const players = [];
    for (let r = headerRow + 3; r < grid.length && players.length < 5; r++) {
      const value = grid[r] && grid[r][col];
      if (value === undefined || String(value).trim() === '') continue;
      if (String(value).trim().toLowerCase() === 'players') continue;
      players.push(String(value));
    }
    return { team, players };
  });
}

const grid = XLSX.utils.sheet_to_json(XLSX.readFile(SOURCE).Sheets.Retained, { header: 1, defval: '' });
const blocks = readRetained(grid);

if (blocks.length !== TEAMS.length) {
  console.error(`Expected ${TEAMS.length} team columns, found ${blocks.length}. Has the sheet layout changed?`);
  process.exit(1);
}

const reference = XLSX.utils.sheet_to_json(XLSX.readFile(REFERENCE).Sheets.Complete_Data, { defval: '' });
const byName = new Map(reference.map(p => [nameKey(p.Name), p]));

const unresolved = [];
const playerRows = [];

blocks
  .sort((a, b) => a.team.TeamID.localeCompare(b.team.TeamID))
  .forEach(({ team, players }) => {
    if (players.length !== 5) {
      console.error(`${team.sheet}: found ${players.length} players, expected 5.`);
      process.exit(1);
    }
    players.forEach((raw, i) => {
      const name = stripMarker(raw);
      const match = byName.get(nameKey(name));
      if (!match) unresolved.push(`${team.TeamName}: ${name}`);
      playerRows.push({
        TeamName: team.TeamName,
        PlayerID: match ? match.PlayerID : '',
        Name: name,
        Role: match ? match.Role : '',
        // Pre-auction players cost nothing (see src/config/cpl2026.js).
        BaseTokens: 0,
        PreAuctionRole: preAuctionRole(raw, i),
        Availability: 'Unknown',
        PhotoFileName: match ? match.PhotoFileName || '' : '',
        Department: match ? match.Department || '' : ''
      });
    });
  });

const teamRows = TEAMS
  .map(({ TeamID, TeamName, LogoFile }) => ({ TeamID, TeamName, LogoFile }))
  .sort((a, b) => a.TeamID.localeCompare(b.TeamID));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teamRows), 'Teams');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(playerRows), 'PreAuction');
XLSX.writeFile(wb, OUTPUT);

console.log(`Wrote ${OUTPUT}`);
console.log(`  ${teamRows.length} teams, ${playerRows.length} pre-auction players`);
console.log(`  ${playerRows.length - unresolved.length} matched against ${REFERENCE}`);
if (unresolved.length) {
  console.log(`\n  ${unresolved.length} players need PlayerID and Role filled in by hand:`);
  unresolved.forEach(u => console.log(`    - ${u}`));
}
