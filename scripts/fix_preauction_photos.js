#!/usr/bin/env node
/**
 * Repairs PhotoFileName in the pre-auction workbook, in place.
 *
 * The values carried over from CPL_Auction_Data_2025.xlsx are descriptive
 * ("pradeep_pala.jpg") and match nothing on disk — every image in public/players
 * is named <PlayerID>.jpg. This rewrites the column to that convention and
 * blanks it where no image exists, so a missing photo is visible rather than a
 * dead path.
 *
 * Edits the existing file rather than regenerating it, so hand-entered PlayerID
 * and Role values survive.
 *
 *   node scripts/fix_preauction_photos.js
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const WORKBOOK = path.join('data', 'CPL_2026_PreAuction_Template.xlsx');
const PHOTO_DIR = path.join('public', 'players');

const available = new Map(fs.readdirSync(PHOTO_DIR).map(f => [f.toLowerCase(), f]));

/** Photos are stored as <PlayerID>.jpg; PlayerID casing in the sheet varies. */
const photoFor = playerId => {
  if (!playerId) return null;
  return available.get(`${String(playerId).toLowerCase()}.jpg`) || null;
};

const wb = XLSX.readFile(WORKBOOK);
const teams = XLSX.utils.sheet_to_json(wb.Sheets.Teams, { defval: '' });
const players = XLSX.utils.sheet_to_json(wb.Sheets.PreAuction, { defval: '' });

const missing = [];
const updated = players.map(row => {
  const photo = photoFor(row.PlayerID);
  if (!photo) missing.push(`${row.TeamName}: ${row.Name} (${row.PlayerID || 'no PlayerID'})`);
  return { ...row, PhotoFileName: photo || '' };
});

const out = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(out, XLSX.utils.json_to_sheet(teams), 'Teams');
XLSX.utils.book_append_sheet(out, XLSX.utils.json_to_sheet(updated), 'PreAuction');
XLSX.writeFile(out, WORKBOOK);

console.log(`Updated ${WORKBOOK}`);
console.log(`  ${updated.length - missing.length} of ${updated.length} players matched to an image`);
if (missing.length) {
  console.log(`\n  ${missing.length} have no image in ${PHOTO_DIR}:`);
  missing.forEach(m => console.log(`    - ${m}`));
  console.log(`\n  Add <PlayerID>.jpg for each, then re-run.`);
}
