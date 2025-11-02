import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatTeamForExport } from './auctionUtils';

export const exportAuctionResults = (teams, auctionHistory, unsoldPlayers) => {
  const workbook = XLSX.utils.book_new();

  // 1. Auction Summary Sheet
  const summaryData = [
    ['CPL AUCTION RESULTS SUMMARY'],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['OVERALL STATISTICS'],
    ['Total Players Sold:', auctionHistory.length],
    ['Total Players Unsold:', unsoldPlayers.length],
    ['Total Tokens Spent:', auctionHistory.reduce((sum, h) => sum + h.SoldPrice, 0)],
    ['Average Sale Price:', auctionHistory.length > 0 ? Math.round(auctionHistory.reduce((sum, h) => sum + h.SoldPrice, 0) / auctionHistory.length) : 0],
    [''],
    ['TEAM SUMMARY'],
    ['Team Name', 'Squad Size', 'Tokens Spent', 'Tokens Remaining', 'Batsmen', 'Bowlers', 'All-rounders', 'Wicket Keepers']
  ];

  Object.entries(teams).forEach(([teamName, teamData]) => {
    summaryData.push([
      teamName,
      teamData.squad.length,
      teamData.maxTokens - teamData.tokensLeft,
      teamData.tokensLeft,
      teamData.roleCount.Batsman || 0,
      teamData.roleCount.Bowler || 0,
      teamData.roleCount['All-rounder'] || 0,
      teamData.roleCount.WicketKeeper || 0
    ]);
  });

  const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');

  // 2. Individual Team Sheets
  Object.entries(teams).forEach(([teamName, teamData]) => {
    const teamExportData = formatTeamForExport(teamName, teamData);
    
    const teamSheetData = [
      [teamName.toUpperCase()],
      [''],
      ['TEAM STATISTICS'],
      ['Squad Size:', teamExportData.squadSize],
      ['Tokens Spent:', teamExportData.tokensSpent],
      ['Tokens Remaining:', teamExportData.tokensRemaining],
      [''],
      ['SQUAD COMPOSITION'],
      ['Batsmen:', teamExportData.roleBreakdown.Batsman || 0],
      ['Bowlers:', teamExportData.roleBreakdown.Bowler || 0],
      ['All-rounders:', teamExportData.roleBreakdown['All-rounder'] || 0],
      ['Wicket Keepers:', teamExportData.roleBreakdown.WicketKeeper || 0],
      [''],
      ['PLAYERS'],
      ['Player Name', 'Role', 'Base Price', 'Bought Price', 'Profit/Loss']
    ];

    teamExportData.players.forEach(player => {
      teamSheetData.push([
        player.name,
        player.role,
        player.basePrice,
        player.boughtPrice,
        player.profit
      ]);
    });

    const teamWS = XLSX.utils.aoa_to_sheet(teamSheetData);
    XLSX.utils.book_append_sheet(workbook, teamWS, teamName.substring(0, 31)); // Excel sheet name limit
  });

  // 3. Auction History Sheet
  const historyData = [
    ['AUCTION HISTORY'],
    [''],
    ['Player Name', 'Role', 'Base Price', 'Sold Price', 'Team', 'Profit/Loss', 'Sale Order']
  ];

  auctionHistory.forEach((entry, index) => {
    historyData.push([
      entry.Player,
      entry.Role,
      entry.BaseTokens,
      entry.SoldPrice,
      entry.Team,
      entry.SoldPrice - entry.BaseTokens,
      index + 1
    ]);
  });

  const historyWS = XLSX.utils.aoa_to_sheet(historyData);
  XLSX.utils.book_append_sheet(workbook, historyWS, 'Auction History');

  // 4. Unsold Players Sheet
  if (unsoldPlayers.length > 0) {
    const unsoldData = [
      ['UNSOLD PLAYERS'],
      [''],
      ['Player Name', 'Role', 'Base Price']
    ];

    unsoldPlayers.forEach(player => {
      unsoldData.push([
        player.Name,
        player.Role,
        player.BaseTokens
      ]);
    });

    const unsoldWS = XLSX.utils.aoa_to_sheet(unsoldData);
    XLSX.utils.book_append_sheet(workbook, unsoldWS, 'Unsold Players');
  }

  // 5. Statistics Sheet
  const roleStats = {};
  auctionHistory.forEach(entry => {
    if (!roleStats[entry.Role]) {
      roleStats[entry.Role] = {
        count: 0,
        totalSpent: 0,
        avgPrice: 0,
        maxPrice: 0,
        minPrice: Infinity
      };
    }
    
    roleStats[entry.Role].count++;
    roleStats[entry.Role].totalSpent += entry.SoldPrice;
    roleStats[entry.Role].maxPrice = Math.max(roleStats[entry.Role].maxPrice, entry.SoldPrice);
    roleStats[entry.Role].minPrice = Math.min(roleStats[entry.Role].minPrice, entry.SoldPrice);
  });

  // Calculate averages
  Object.keys(roleStats).forEach(role => {
    roleStats[role].avgPrice = Math.round(roleStats[role].totalSpent / roleStats[role].count);
    if (roleStats[role].minPrice === Infinity) roleStats[role].minPrice = 0;
  });

  const statsData = [
    ['AUCTION STATISTICS BY ROLE'],
    [''],
    ['Role', 'Players Sold', 'Total Spent', 'Average Price', 'Highest Price', 'Lowest Price']
  ];

  Object.entries(roleStats).forEach(([role, stats]) => {
    statsData.push([
      role,
      stats.count,
      stats.totalSpent,
      stats.avgPrice,
      stats.maxPrice,
      stats.minPrice
    ]);
  });

  const statsWS = XLSX.utils.aoa_to_sheet(statsData);
  XLSX.utils.book_append_sheet(workbook, statsWS, 'Statistics');

  // Generate and download file
  const fileName = `CPL_Auction_Results_${new Date().toISOString().split('T')[0]}.xlsx`;
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  
  saveAs(blob, fileName);
  
  return fileName;
};

export const exportTeamSheet = (teamName, teamData) => {
  const workbook = XLSX.utils.book_new();
  const teamExportData = formatTeamForExport(teamName, teamData);
  
  const teamSheetData = [
    [teamName.toUpperCase()],
    ['Generated on:', new Date().toLocaleString()],
    [''],
    ['TEAM STATISTICS'],
    ['Squad Size:', teamExportData.squadSize],
    ['Tokens Spent:', teamExportData.tokensSpent],
    ['Tokens Remaining:', teamExportData.tokensRemaining],
    [''],
    ['SQUAD COMPOSITION'],
    ['Batsmen:', teamExportData.roleBreakdown.Batsman || 0],
    ['Bowlers:', teamExportData.roleBreakdown.Bowler || 0],
    ['All-rounders:', teamExportData.roleBreakdown['All-rounder'] || 0],
    ['Wicket Keepers:', teamExportData.roleBreakdown.WicketKeeper || 0],
    [''],
    ['PLAYERS'],
    ['Player Name', 'Role', 'Base Price', 'Bought Price', 'Profit/Loss']
  ];

  teamExportData.players.forEach(player => {
    teamSheetData.push([
      player.name,
      player.role,
      player.basePrice,
      player.boughtPrice,
      player.profit
    ]);
  });

  const teamWS = XLSX.utils.aoa_to_sheet(teamSheetData);
  XLSX.utils.book_append_sheet(workbook, teamWS, teamName);

  const fileName = `${teamName}_Squad_${new Date().toISOString().split('T')[0]}.xlsx`;
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  
  saveAs(blob, fileName);
  
  return fileName;
};