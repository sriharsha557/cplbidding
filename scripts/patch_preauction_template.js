#!/usr/bin/env node
/**
 * One-off patches to data/CPL_2026_PreAuction_Template.xlsx that the export
 * cannot derive: PlayerID/Role for players new in 2026, and role corrections
 * for retained players whose 2025 record is wrong.
 *
 * Matched by Name against the PreAuction sheet. Edits in place so a later
 * fix_preauction_photos.js run still sees hand-entered values.
 *
 *   node scripts/patch_preauction_template.js
 */
const XLSX = require('xlsx');
const path = require('path');

const WORKBOOK = path.join('data', 'CPL_2026_PreAuction_Template.xlsx');

/** Name in the Retained sheet -> fields to overwrite. */
const PATCHES = {
  // Close 2025 matches confirmed by the owner (spelling drift in the sheet).
  'Prakash Kilaparti':       { PlayerID: 'CQX4', Role: 'All-rounder', Department: 'All-rounder' },
  'Jagadish Koppula':        { PlayerID: '628B', Role: 'All-rounder', Department: 'All-rounder' },
  'Jyothi Radithya Koredla': { PlayerID: '61EX', Role: 'All-rounder', Department: 'All-rounder' },
  // New for 2026: no prior record, IDs and roles supplied by the owner.
  'Sriharsha Siddam':                       { PlayerID: 'MPB8', Role: 'Batsman' },
  'Mohammad Aquib Noman':                   { PlayerID: '6LJX', Role: 'Batsman' },
  'Venkata Ramana Sashidhar Vasamsetty':    { PlayerID: 'CNC0', Role: 'All-rounder' },
  // Retained player whose 2025 role is wrong: registered WicketKeeper, is a Bowler.
  'Mahether Reddy Bhavanam': { Role: 'Bowler', Department: 'Bowler' }
};

const wb = XLSX.readFile(WORKBOOK);
const teams = XLSX.utils.sheet_to_json(wb.Sheets.Teams, { defval: '' });
const players = XLSX.utils.sheet_to_json(wb.Sheets.PreAuction, { defval: '' });

const applied = [];
const updated = players.map(row => {
  const patch = PATCHES[String(row.Name).trim()];
  if (!patch) return row;
  applied.push(`${row.TeamName}: ${row.Name} <- ${JSON.stringify(patch)}`);
  return { ...row, ...patch };
});

const unmatched = Object.keys(PATCHES).filter(
  name => !players.some(r => String(r.Name).trim() === name)
);

const out = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(out, XLSX.utils.json_to_sheet(teams), 'Teams');
XLSX.utils.book_append_sheet(out, XLSX.utils.json_to_sheet(updated), 'PreAuction');
XLSX.writeFile(out, WORKBOOK);

console.log(`Patched ${WORKBOOK}`);
applied.forEach(a => console.log(`  ${a}`));
if (unmatched.length) {
  console.log(`\n  ${unmatched.length} patch name(s) matched nobody in the sheet:`);
  unmatched.forEach(n => console.log(`    - ${n}`));
}
