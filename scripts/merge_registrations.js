#!/usr/bin/env node
/**
 * Folds a newer registration workbook into CPL2026.xlsx, the single source of
 * truth, so there is only one file to maintain.
 *
 * Later exports of the Google Form drop the hand-added "Base Token" column,
 * which carries the auction running order. Merging on Employee ID keeps those
 * rankings while picking up new registrants and any Comments they wrote.
 *
 *   node scripts/merge_registrations.js "CPL2026 (2).xlsx"
 *
 * Back the target up first; this rewrites it, and the xlsx writer does not
 * round-trip cell styling.
 */
const XLSX = require('xlsx');

const INCOMING = process.argv[2] || 'CPL2026 (2).xlsx';
const TARGET = process.argv[3] || 'CPL2026.xlsx';

/** Column order the target keeps, so the merged sheet looks unchanged. */
const COLUMNS = ['S.NO', 'Full Name', 'Employee ID', 'Contact Number',
  'Preferred Role', 'Secondary Role', 'Base Token', 'Comments'];

const realRows = sheet => XLSX.utils
  .sheet_to_json(sheet, { defval: '' })
  .filter(r => String(r['Full Name'] || '').trim() !== '');

const id = r => String(r['Employee ID'] || '').trim().toLowerCase();

const target = XLSX.readFile(TARGET);
const incoming = XLSX.readFile(INCOMING);

const existing = realRows(target.Sheets['Auction Players']);
const arriving = realRows(incoming.Sheets['Auction Players']);

/** Rankings live only in the target once the form stops exporting them. */
const rankings = new Map(
  existing.filter(r => String(r['Base Token'] || '').trim())
    .map(r => [id(r), String(r['Base Token']).trim()])
);

const known = new Set(existing.map(id));
const added = arriving.filter(r => !known.has(id(r)));
const seenNow = new Set(arriving.map(id));
const dropped = existing.filter(r => !seenNow.has(id(r)));

let commentsGained = 0;
const merged = arriving.map((r, i) => {
  const before = existing.find(e => id(e) === id(r));
  const comment = String(r.Comments || '').trim() || String(before?.Comments || '').trim();
  if (comment && !String(before?.Comments || '').trim()) commentsGained++;
  const row = {};
  COLUMNS.forEach(c => { row[c] = c === 'Comments' ? comment : (r[c] !== undefined ? r[c] : ''); });
  row['S.NO'] = i + 1;
  row['Base Token'] = String(r['Base Token'] || '').trim() || rankings.get(id(r)) || '';
  return row;
});

// Retained comes from whichever file has content; trim the blank padding.
const retainedRows = XLSX.utils.sheet_to_json(
  incoming.Sheets.Retained || target.Sheets.Retained, { header: 1, defval: '' });
while (retainedRows.length && retainedRows[retainedRows.length - 1].every(c => String(c).trim() === '')) {
  retainedRows.pop();
}

const out = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(out, XLSX.utils.json_to_sheet(merged, { header: COLUMNS }), 'Auction Players');
XLSX.utils.book_append_sheet(out, XLSX.utils.aoa_to_sheet(retainedRows), 'Retained');
XLSX.writeFile(out, TARGET);

console.log(`Merged ${INCOMING} into ${TARGET}`);
console.log(`  ${existing.length} existing + ${added.length} new = ${merged.length} registrations`);
console.log(`  ${merged.filter(r => String(r['Base Token']).trim()).length} keep a Base Token ranking`);
console.log(`  ${merged.filter(r => String(r.Comments).trim()).length} have comments (${commentsGained} newly added)`);
if (added.length) {
  console.log('\n  new registrants:');
  added.forEach(r => console.log(`    ${String(r['Employee ID']).trim()}  ${String(r['Full Name']).trim()}`));
}
if (dropped.length) {
  console.log(`\n  WARNING: ${dropped.length} in ${TARGET} are absent from ${INCOMING} and have been removed:`);
  dropped.forEach(r => console.log(`    ${String(r['Employee ID']).trim()}  ${String(r['Full Name']).trim()}`));
}
