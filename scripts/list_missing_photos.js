#!/usr/bin/env node
/**
 * Lists every 2026 player with no photo in public/players.
 *
 * Photos are stored as <PlayerID>.jpg. Covers both squads: the pre-auction five
 * per team from the upload workbook, and the auction pool from CPL2026.xlsx.
 *
 *   node scripts/list_missing_photos.js
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const PHOTO_DIR = path.join('public', 'players');
const PRE_AUCTION = path.join('data', 'CPL_2026_PreAuction_Template.xlsx');
const SOURCE = process.argv[2] || 'CPL2026.xlsx';

/** Keep both maps in step with export_auction_players_from_cpl2026.js. */
const ID_CORRECTIONS = { PRCHI: '399x' };
const EXCLUDED_IDS = ['4YVM'];

const have = new Set(fs.readdirSync(PHOTO_DIR).map(f => f.toLowerCase()));
const hasPhoto = id => id && have.has(`${String(id).toLowerCase()}.jpg`);

const rows = [];

XLSX.utils
  .sheet_to_json(XLSX.readFile(PRE_AUCTION).Sheets.PreAuction, { defval: '' })
  .forEach(r => rows.push({ group: r.TeamName, id: r.PlayerID, name: r.Name }));

XLSX.utils
  .sheet_to_json(XLSX.readFile(SOURCE).Sheets['Auction Players'], { defval: '' })
  .filter(r => String(r['Full Name']).trim())
  .filter(r => !EXCLUDED_IDS.includes(String(r['Employee ID']).trim().toUpperCase()))
  .forEach(r => {
    const raw = String(r['Employee ID']).trim();
    rows.push({ group: 'Auction pool', id: ID_CORRECTIONS[raw] || raw, name: String(r['Full Name']).trim() });
  });

const missing = rows.filter(r => !hasPhoto(r.id));

console.log(`${rows.length} players total, ${rows.length - missing.length} with photos, ${missing.length} missing\n`);

const groups = [...new Set(missing.map(m => m.group))];
groups.forEach(g => {
  const inGroup = missing.filter(m => m.group === g);
  console.log(`${g} (${inGroup.length})`);
  inGroup.forEach(m => console.log(`  ${String(m.id || 'NO ID').padEnd(8)} ${m.name}`));
  console.log('');
});

console.log(`Drop each file into ${PHOTO_DIR} named <PlayerID>.jpg, then re-run.`);
console.log('For pre-auction players also run scripts/fix_preauction_photos.js to refresh the workbook.');
