#!/usr/bin/env node
/**
 * Checks what is actually in Supabase against what the exports say it should be.
 *
 * Run after each load step. The failure this exists to catch: 24 retained
 * players once sat in the database with status Available and sold_to NULL,
 * biddable by any team, and nothing surfaced it until auction data was
 * inspected by hand.
 *
 *   node scripts/verify_load.js
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EOL = String.fromCharCode(10);

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const URL = env.REACT_APP_SUPABASE_URL;
const KEY = env.REACT_APP_SUPABASE_ANON_KEY;

const get = p => fetch(`${URL}/rest/v1/${p}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
  .then(r => r.json());

const sheet = (file, name) => XLSX.utils.sheet_to_json(XLSX.readFile(file).Sheets[name], { defval: '' });

(async () => {
  const pre = sheet(path.join('data', 'CPL_2026_PreAuction_Template.xlsx'), 'PreAuction');
  const pool = sheet(path.join('data', 'CPL_2026_AuctionPlayers.xlsx'), 'Players');

  const players = await get('players?select=player_id,name,status,sold_to,pre_auction_role,comments&limit=2000');
  const teams = await get('teams?select=team_id,team_name');

  const checks = [];
  const check = (label, actual, expected) =>
    checks.push({ label, actual, expected, ok: actual === expected });

  check('teams', teams.length, 8);
  check('players total', players.length, pre.length + pool.length);
  check('locked as PreAuction', players.filter(p => p.status === 'PreAuction').length, pre.length);
  check('available for auction', players.filter(p => p.status === 'Available').length, pool.length);

  const retainedLoose = players.filter(p => p.pre_auction_role && p.status !== 'PreAuction');
  check('retained players loose in the pool', retainedLoose.length, 0);

  const noTeam = players.filter(p => p.status === 'PreAuction' && !p.sold_to);
  check('PreAuction rows without a team', noTeam.length, 0);

  const expected = new Set([...pre, ...pool].map(r => String(r.PlayerID).toLowerCase()));
  const unexpected = players.filter(p => !expected.has(p.player_id.toLowerCase()));
  check('rows not in either export', unexpected.length, 0);

  // player_id is case-sensitive in Postgres, so 6ljx and 6LJX are two rows.
  // A corrected id upserts alongside the old one instead of replacing it.
  const byLower = players.reduce((a, p) => {
    const k = p.player_id.toLowerCase();
    (a[k] = a[k] || []).push(p.player_id);
    return a;
  }, {});
  const caseDupes = Object.entries(byLower).filter(([, ids]) => ids.length > 1);
  check('ids duplicated by letter case', caseDupes.length, 0);

  const inDb = new Set(players.map(p => p.player_id.toLowerCase()));
  check('exported rows missing from db', [...expected].filter(i => !inDb.has(i)).length, 0);

  check('comments loaded', players.filter(p => p.comments).length,
    pool.filter(r => String(r.Comments || '').trim()).length);

  const squads = players.filter(p => p.status === 'PreAuction')
    .reduce((a, p) => ({ ...a, [p.sold_to]: (a[p.sold_to] || 0) + 1 }), {});
  const wrongSize = Object.entries(squads).filter(([, n]) => n !== 5);
  check('teams without exactly 5 retained', wrongSize.length, 0);

  let failed = 0;
  checks.forEach(c => {
    if (!c.ok) failed++;
    console.log(`${c.ok ? 'ok  ' : 'FAIL'}  ${c.label.padEnd(38)} ${c.actual}${c.ok ? '' : ` (expected ${c.expected})`}`);
  });

  if (retainedLoose.length) {
    console.log('\nretained players that would be auctioned:');
    retainedLoose.slice(0, 10).forEach(p => console.log(`  ${p.player_id}  ${p.name}`));
  }
  if (caseDupes.length) {
    console.log(EOL + 'same player under two ids:');
    caseDupes.forEach(([, ids]) => console.log(`  ${ids.join('  vs  ')}`));
  }
  if (unexpected.length) {
    console.log('\nrows in the database that no export produced:');
    unexpected.forEach(p => console.log(`  ${p.player_id}  ${p.name}`));
  }
  if (wrongSize.length) {
    console.log('\nsquads that are not 5:');
    wrongSize.forEach(([t, n]) => console.log(`  ${t}: ${n}`));
  }

  console.log(`\n${failed === 0 ? 'All checks passed.' : `${failed} check(s) failed.`}`);
  process.exit(failed === 0 ? 0 : 1);
})();
