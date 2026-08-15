/**
 * Generates the blank CPL 2026 pre-auction upload workbook.
 *
 * Usage: node scripts/create_pre_auction_template.js
 *
 * Team names are unchanged from 2025. Logo filenames are the ones that
 * actually exist in public/ — scripts/update_team_names_and_logos.py is stale
 * and names two files that are not there.
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

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

const SLOTS = ['Captain', 'ViceCaptain', 'Squad', 'Squad', 'Squad'];

const playerRows = [];
TEAMS.forEach(team => {
  SLOTS.forEach(slot => {
    playerRows.push({
      TeamName: team.TeamName,
      PlayerID: '',
      Name: '',
      Role: '',
      BaseTokens: '',
      PreAuctionRole: slot,
      Availability: 'Unknown',
      PhotoFileName: '',
      Department: ''
    });
  });
});

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(TEAMS), 'Teams');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(playerRows), 'PreAuction');

const outDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'CPL_2026_PreAuction_Template.xlsx');
XLSX.writeFile(wb, outPath);

console.log('Wrote ' + outPath);
console.log(TEAMS.length + ' teams, ' + playerRows.length + ' player rows');
console.log('');
console.log('Fill in PlayerID, Name, Role and BaseTokens for all 40 rows.');
console.log('Role must be one of: Batsman, Bowler, All-rounder, WicketKeeper');
console.log('Set Availability to Available once a player has confirmed 12 Sep - 4 Oct.');
