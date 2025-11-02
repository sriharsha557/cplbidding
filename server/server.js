const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from assets directory
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// Paths
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const EXCEL_PATH = path.join(ASSETS_DIR, 'Cpl_data.xlsx');

// CPL Category Budget Rules
const CATEGORY_BUDGETS = {
  'Batsman': { min: 300, max: 400, minPlayers: 4, maxPlayers: 5 },
  'Bowler': { min: 300, max: 400, minPlayers: 4, maxPlayers: 5 },
  'All-rounder': { min: 150, max: 200, minPlayers: 3, maxPlayers: 4 },
  'WicketKeeper': { min: 100, max: 150, minPlayers: 2, maxPlayers: 3 }
};

// Initialize teams from Excel data with CPL budget rules
function initializeTeamsFromExcel(teamsData, maxTokens = 1000, maxSquadSize = 15) {
  const teams = {};
  
  teamsData.forEach(row => {
    const teamName = row.TeamName;
    teams[teamName] = {
      id: row.TeamID,
      logo: row.LogoFile,
      tokensLeft: maxTokens,
      squad: [],
      maxTokens: maxTokens,
      maxSquadSize: maxSquadSize,
      roleCount: {
        'Batsman': 0,
        'Bowler': 0,
        'WicketKeeper': 0,
        'All-rounder': 0
      },
      // CPL Category Budgets
      categoryBudgets: {
        'Batsman': { spent: 0, remaining: CATEGORY_BUDGETS.Batsman.max },
        'Bowler': { spent: 0, remaining: CATEGORY_BUDGETS.Bowler.max },
        'All-rounder': { spent: 0, remaining: CATEGORY_BUDGETS['All-rounder'].max },
        'WicketKeeper': { spent: 0, remaining: CATEGORY_BUDGETS.WicketKeeper.max }
      }
    };
  });
  
  return teams;
}

// Update Excel file when player is sold
async function updateExcelWithSale(playerId, teamName, bidPrice) {
  try {
    // Read current Excel file
    const workbook = XLSX.readFile(EXCEL_PATH);
    const playersSheet = workbook.Sheets['Players'] || workbook.Sheets[workbook.SheetNames[0]];
    const playersData = XLSX.utils.sheet_to_json(playersSheet);

    // Find and update the player
    const updatedPlayers = playersData.map(player => {
      if (player.PlayerID === playerId) {
        return {
          ...player,
          Status: 'Sold',
          SoldTo: teamName,
          SoldPrice: bidPrice,
          UpdatedAt: new Date().toISOString()
        };
      }
      return player;
    });

    // Convert back to sheet and save
    const newPlayersSheet = XLSX.utils.json_to_sheet(updatedPlayers);
    workbook.Sheets['Players'] = newPlayersSheet;
    
    // Write back to file
    XLSX.writeFile(workbook, EXCEL_PATH);
    
    console.log(`✅ Excel updated: Player ${playerId} sold to ${teamName} for ${bidPrice} tokens`);
  } catch (error) {
    console.error('❌ Error updating Excel file:', error);
    throw error;
  }
}

// Update Excel file when player is marked unsold
async function updateExcelWithUnsold(playerId) {
  try {
    // Read current Excel file
    const workbook = XLSX.readFile(EXCEL_PATH);
    const playersSheet = workbook.Sheets['Players'] || workbook.Sheets[workbook.SheetNames[0]];
    const playersData = XLSX.utils.sheet_to_json(playersSheet);

    // Find and update the player
    const updatedPlayers = playersData.map(player => {
      if (player.PlayerID === playerId) {
        return {
          ...player,
          Status: 'Unsold',
          SoldTo: '',
          SoldPrice: 0,
          UpdatedAt: new Date().toISOString()
        };
      }
      return player;
    });

    // Convert back to sheet and save
    const newPlayersSheet = XLSX.utils.json_to_sheet(updatedPlayers);
    workbook.Sheets['Players'] = newPlayersSheet;
    
    // Write back to file
    XLSX.writeFile(workbook, EXCEL_PATH);
    
    console.log(`✅ Excel updated: Player ${playerId} marked as unsold`);
  } catch (error) {
    console.error('❌ Error updating Excel file:', error);
    throw error;
  }
}

// Load data from Excel file
app.get('/api/load-data', async (req, res) => {
  try {
    // Check if Excel file exists
    const fileExists = await fs.access(EXCEL_PATH).then(() => true).catch(() => false);
    
    if (!fileExists) {
      return res.status(404).json({
        error: 'Excel file not found',
        path: EXCEL_PATH,
        message: 'Please ensure Cpl_data.xlsx exists in the assets folder'
      });
    }

    // Read Excel file
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetNames = workbook.SheetNames;
    
    console.log('Available sheets:', sheetNames);

    // Load Players sheet
    let playersSheet;
    if (sheetNames.includes('Players')) {
      playersSheet = 'Players';
    } else if (sheetNames.length > 0) {
      playersSheet = sheetNames[0];
      console.warn(`Using first sheet '${playersSheet}' for Players data`);
    } else {
      return res.status(400).json({
        error: 'No sheets found in Excel file'
      });
    }

    // Load Teams sheet
    let teamsSheet;
    if (sheetNames.includes('Teams')) {
      teamsSheet = 'Teams';
    } else if (sheetNames.length > 1) {
      teamsSheet = sheetNames[1];
      console.warn(`Using second sheet '${teamsSheet}' for Teams data`);
    } else {
      return res.status(400).json({
        error: 'Excel file must have at least 2 sheets (Players and Teams)'
      });
    }

    // Convert sheets to JSON
    const playersData = XLSX.utils.sheet_to_json(workbook.Sheets[playersSheet]);
    const teamsData = XLSX.utils.sheet_to_json(workbook.Sheets[teamsSheet]);

    // Validate required columns
    const requiredPlayerCols = ['PlayerID', 'Name', 'Role', 'BaseTokens'];
    const requiredTeamCols = ['TeamID', 'TeamName', 'LogoFile'];

    const playerCols = Object.keys(playersData[0] || {});
    const teamCols = Object.keys(teamsData[0] || {});

    const missingPlayerCols = requiredPlayerCols.filter(col => !playerCols.includes(col));
    const missingTeamCols = requiredTeamCols.filter(col => !teamCols.includes(col));

    if (missingPlayerCols.length > 0) {
      return res.status(400).json({
        error: 'Missing required columns in Players sheet',
        missing: missingPlayerCols,
        found: playerCols
      });
    }

    if (missingTeamCols.length > 0) {
      return res.status(400).json({
        error: 'Missing required columns in Teams sheet',
        missing: missingTeamCols,
        found: teamCols
      });
    }

    // Initialize teams
    const teams = initializeTeamsFromExcel(teamsData);

    res.json({
      players: playersData,
      teams: teams,
      message: `Loaded ${playersData.length} players and ${teamsData.length} teams`
    });

  } catch (error) {
    console.error('Error loading data:', error);
    res.status(500).json({
      error: 'Failed to load auction data',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Validate bid against CPL rules
function validateBid(teams, teamName, playerRole, bidPrice) {
  const team = teams[teamName];
  const categoryRules = CATEGORY_BUDGETS[playerRole];
  const categoryBudget = team.categoryBudgets[playerRole];
  
  const errors = [];
  
  // Check total tokens
  if (team.tokensLeft < bidPrice) {
    errors.push(`Insufficient total tokens. Available: ${team.tokensLeft}, Required: ${bidPrice}`);
  }
  
  // Check category budget
  if (categoryBudget.remaining < bidPrice) {
    errors.push(`Insufficient ${playerRole} budget. Available: ${categoryBudget.remaining}, Required: ${bidPrice}`);
  }
  
  // Check maximum players per category
  if (team.roleCount[playerRole] >= categoryRules.maxPlayers) {
    errors.push(`Maximum ${playerRole} players reached (${categoryRules.maxPlayers})`);
  }
  
  // Check if team can still afford minimum required players
  const remainingTokensAfterBid = team.tokensLeft - bidPrice;
  const remainingCategoryBudgetAfterBid = categoryBudget.remaining - bidPrice;
  
  // Calculate minimum tokens needed for remaining required players
  let minTokensNeeded = 0;
  Object.keys(CATEGORY_BUDGETS).forEach(role => {
    const rules = CATEGORY_BUDGETS[role];
    const currentCount = team.roleCount[role] + (role === playerRole ? 1 : 0);
    const stillNeeded = Math.max(0, rules.minPlayers - currentCount);
    minTokensNeeded += stillNeeded * 20; // Minimum 20 tokens per player
  });
  
  if (remainingTokensAfterBid < minTokensNeeded) {
    errors.push(`This bid would prevent meeting minimum squad requirements. Need ${minTokensNeeded} tokens for remaining players.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sell player endpoint with CPL validation
app.post('/api/sell-player', async (req, res) => {
  try {
    const { playerId, teamName, bidPrice, playerRole } = req.body;

    if (!playerId || !teamName || !bidPrice || !playerRole) {
      return res.status(400).json({
        error: 'Missing required fields: playerId, teamName, bidPrice, playerRole'
      });
    }

    // Load current teams data for validation
    const workbook = XLSX.readFile(EXCEL_PATH);
    const teamsData = XLSX.utils.sheet_to_json(workbook.Sheets['Teams'] || workbook.Sheets[1]);
    const teams = initializeTeamsFromExcel(teamsData);
    
    // TODO: Load current auction state from somewhere (database/file)
    // For now, we'll skip real-time validation and trust the frontend
    
    // Validate bid
    const validation = validateBid(teams, teamName, playerRole, bidPrice);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid bid',
        details: validation.errors
      });
    }

    // Update Excel file with auction results
    await updateExcelWithSale(playerId, teamName, bidPrice);

    console.log(`Player ${playerId} sold to ${teamName} for ${bidPrice} tokens`);

    res.json({
      success: true,
      message: `Player sold to ${teamName} for ${bidPrice} tokens`
    });

  } catch (error) {
    console.error('Error selling player:', error);
    res.status(500).json({
      error: 'Failed to sell player',
      message: error.message
    });
  }
});

// Mark player unsold endpoint
app.post('/api/mark-unsold', async (req, res) => {
  try {
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({
        error: 'Missing required field: playerId'
      });
    }

    // Update Excel file to mark player as unsold
    await updateExcelWithUnsold(playerId);

    console.log(`Player ${playerId} marked as unsold`);

    res.json({
      success: true,
      message: `Player ${playerId} marked as unsold`
    });

  } catch (error) {
    console.error('Error marking player unsold:', error);
    res.status(500).json({
      error: 'Failed to mark player unsold',
      message: error.message
    });
  }
});

// Get auction history endpoint
app.get('/api/auction-history', async (req, res) => {
  try {
    // In a real implementation, you'd read this from the Excel file
    // For now, return empty array
    res.json([]);
  } catch (error) {
    console.error('Error getting auction history:', error);
    res.status(500).json({
      error: 'Failed to get auction history',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CPL Auction Server running on port ${PORT}`);
  console.log(`📁 Assets directory: ${ASSETS_DIR}`);
  console.log(`📊 Excel file path: ${EXCEL_PATH}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});