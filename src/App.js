import React, { useState, useEffect } from 'react';
import { Target, History, Eye, RotateCcw, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

import AuctionSetup from './components/AuctionSetup';
import LiveAuction from './components/LiveAuction';
import UnsoldPlayers from './components/UnsoldPlayers';
import AuctionHistory from './components/AuctionHistory';
import TeamDashboard from './components/TeamDashboard';
import AuctionProgress from './components/AuctionProgress';
import { NotificationProvider } from './components/NotificationSystem';


import { auctionService } from './services/auctionService';
import { supabaseAuctionService } from './services/supabaseService';

import { sortPlayersByAuctionOrder, ROLE_EMOJIS, playSound } from './utils/auctionUtils';
import { exportAuctionResults } from './utils/excelExport';



function App() {
  const [auctionState, setAuctionState] = useState({
    initialized: false,
    auctionStarted: false,
    currentPlayerIdx: 0,
    players: [],
    teams: {},
    auctionHistory: [],
    unsoldPlayers: [],
    maxTokens: 1000,
    maxSquadSize: 15
  });

  const [activeTab, setActiveTab] = useState('auction');
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    // Initialize auction state
    setAuctionState(prev => ({ ...prev, initialized: true }));
    
    // Handle window resize for confetti
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadAuctionData = async () => {
    setLoading(true);
    const loadingToast = toast.loading('Loading auction data...');
    
    try {
      // Try Supabase first, fallback to Excel
      let data;
      try {
        data = await supabaseAuctionService.loadData();
        toast.loading('Loaded from Supabase', { id: loadingToast });
      } catch (supabaseError) {
        console.warn('Supabase failed, trying Excel:', supabaseError);
        toast.loading('Loading from Excel...', { id: loadingToast });
        
        data = await auctionService.loadData();
        
        // Initialize teams with CPL category budgets for Excel data
        const teamsWithBudgets = {};
        Object.keys(data.teams).forEach(teamName => {
          teamsWithBudgets[teamName] = {
            ...data.teams[teamName],
            categoryBudgets: {
              'Batsman': { spent: 0, remaining: 400, min: 300, max: 400, minPlayers: 4, maxPlayers: 5 },
              'Bowler': { spent: 0, remaining: 400, min: 300, max: 400, minPlayers: 4, maxPlayers: 5 },
              'All-rounder': { spent: 0, remaining: 200, min: 150, max: 200, minPlayers: 3, maxPlayers: 4 },
              'WicketKeeper': { spent: 0, remaining: 150, min: 100, max: 150, minPlayers: 2, maxPlayers: 3 }
            }
          };
        });
        data.teams = teamsWithBudgets;
      }
      
      // Sort players by auction order (Batsmen first, then Bowlers, etc.)
      const sortedPlayers = sortPlayersByAuctionOrder(data.players);
      
      setAuctionState(prev => ({
        ...prev,
        players: sortedPlayers,
        teams: data.teams
      }));
      
      toast.success(`Loaded ${sortedPlayers.length} players & ${Object.keys(data.teams).length} teams`, {
        id: loadingToast
      });
    } catch (error) {
      console.error('Failed to load auction data:', error);
      toast.error('Failed to load auction data', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const startAuction = () => {
    setAuctionState(prev => ({ ...prev, auctionStarted: true }));
    setActiveTab('auction');
    toast.success('🎯 Auction Started! Good luck to all teams!');
    playSound('auction-start');
  };

  const resetAuction = async () => {
    const confirmReset = window.confirm(
      '🚨 This will reset ALL auction data including:\n\n' +
      '• All player sales and assignments\n' +
      '• Team budgets and squad compositions\n' +
      '• Auction history\n\n' +
      'Are you sure you want to continue?'
    );

    if (!confirmReset) return;

    const resetToast = toast.loading('Resetting auction data...');

    try {
      // Reset Supabase data first
      const result = await supabaseAuctionService.resetAuctionData();
      
      if (result.success) {
        // Then reset local state
        setAuctionState({
          initialized: true,
          auctionStarted: false,
          currentPlayerIdx: 0,
          players: [],
          teams: {},
          auctionHistory: [],
          unsoldPlayers: [],
          maxTokens: 1000,
          maxSquadSize: 15
        });
        setActiveTab('auction');
        
        toast.success('🔄 Auction data reset successfully!', { id: resetToast });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to reset auction:', error);
      toast.error(`Failed to reset: ${error.message}`, { id: resetToast });
    }
  };

  const sellPlayer = async (teamName, bidPrice) => {
    const currentPlayer = auctionState.players[auctionState.currentPlayerIdx];
    
    try {
      // Try Supabase first, fallback to Excel service
      try {
        await supabaseAuctionService.sellPlayer(currentPlayer.PlayerID, teamName, bidPrice, currentPlayer.Role);
      } catch (supabaseError) {
        console.warn('Supabase failed, using Excel service:', supabaseError);
        await auctionService.sellPlayer(currentPlayer.PlayerID, teamName, bidPrice, currentPlayer.Role);
      }
      
      // Update local state with CPL category budget tracking
      const updatedTeams = { ...auctionState.teams };
      updatedTeams[teamName].squad.push({
        ...currentPlayer,
        BidPrice: bidPrice
      });
      updatedTeams[teamName].tokensLeft -= bidPrice;
      updatedTeams[teamName].roleCount[currentPlayer.Role]++;
      
      // Update category budget
      if (updatedTeams[teamName].categoryBudgets) {
        updatedTeams[teamName].categoryBudgets[currentPlayer.Role].spent += bidPrice;
        updatedTeams[teamName].categoryBudgets[currentPlayer.Role].remaining -= bidPrice;
      }

      const historyEntry = {
        Player: currentPlayer.Name,
        Role: currentPlayer.Role,
        BaseTokens: currentPlayer.BaseTokens,
        SoldPrice: bidPrice,
        Team: teamName,
        TokensLeft: updatedTeams[teamName].tokensLeft,
        SquadSize: updatedTeams[teamName].squad.length,
        CategoryBudgetRemaining: updatedTeams[teamName].categoryBudgets?.[currentPlayer.Role]?.remaining || 0
      };

      const newPlayerIdx = auctionState.currentPlayerIdx + 1;
      const isAuctionComplete = newPlayerIdx >= auctionState.players.length;

      setAuctionState(prev => ({
        ...prev,
        teams: updatedTeams,
        auctionHistory: [...prev.auctionHistory, historyEntry],
        currentPlayerIdx: newPlayerIdx
      }));

      // Show success notification
      toast.success(`🎉 ${currentPlayer.Name} sold to ${teamName} for ${bidPrice} tokens!`);
      playSound('player-sold');

      // Show confetti if auction is complete
      if (isAuctionComplete) {
        setShowConfetti(true);
        toast.success('🏆 Auction Complete! All players have been processed!');
        setTimeout(() => setShowConfetti(false), 5000);
      }

    } catch (error) {
      console.error('Failed to sell player:', error);
      toast.error('Failed to sell player');
      throw error;
    }
  };

  const markUnsold = async () => {
    const currentPlayer = auctionState.players[auctionState.currentPlayerIdx];
    
    try {
      // Try Supabase first, fallback to Excel service
      try {
        await supabaseAuctionService.markUnsold(currentPlayer.PlayerID);
      } catch (supabaseError) {
        console.warn('Supabase failed, using Excel service:', supabaseError);
        await auctionService.markUnsold(currentPlayer.PlayerID);
      }
      
      const newPlayerIdx = auctionState.currentPlayerIdx + 1;
      const isAuctionComplete = newPlayerIdx >= auctionState.players.length;
      
      setAuctionState(prev => ({
        ...prev,
        unsoldPlayers: [...prev.unsoldPlayers, currentPlayer],
        currentPlayerIdx: newPlayerIdx
      }));

      toast(`${currentPlayer.Name} marked as unsold`, { icon: '❌' });
      playSound('player-unsold');

      // Show confetti if auction is complete
      if (isAuctionComplete) {
        setShowConfetti(true);
        toast.success('🏆 Auction Complete! All players have been processed!');
        setTimeout(() => setShowConfetti(false), 5000);
      }

    } catch (error) {
      console.error('Failed to mark player unsold:', error);
      toast.error('Failed to mark player unsold');
      throw error;
    }
  };

  const assignUnsoldPlayer = async (playerIdx, teamName, price) => {
    const player = auctionState.unsoldPlayers[playerIdx];
    
    try {
      await auctionService.sellPlayer(player.PlayerID, teamName, price);
      
      // Update teams and remove from unsold
      const updatedTeams = { ...auctionState.teams };
      updatedTeams[teamName].squad.push({ ...player, BidPrice: price });
      updatedTeams[teamName].tokensLeft -= price;
      updatedTeams[teamName].roleCount[player.Role]++;
      
      // Update category budget
      if (updatedTeams[teamName].categoryBudgets) {
        updatedTeams[teamName].categoryBudgets[player.Role].spent += price;
        updatedTeams[teamName].categoryBudgets[player.Role].remaining -= price;
      }

      const historyEntry = {
        Player: player.Name,
        Role: player.Role,
        BaseTokens: player.BaseTokens,
        SoldPrice: price,
        Team: teamName,
        TokensLeft: updatedTeams[teamName].tokensLeft,
        SquadSize: updatedTeams[teamName].squad.length,
        CategoryBudgetRemaining: updatedTeams[teamName].categoryBudgets?.[player.Role]?.remaining || 0
      };

      const updatedUnsold = auctionState.unsoldPlayers.filter((_, idx) => idx !== playerIdx);

      setAuctionState(prev => ({
        ...prev,
        teams: updatedTeams,
        auctionHistory: [...prev.auctionHistory, historyEntry],
        unsoldPlayers: updatedUnsold
      }));

      toast.success(`🎉 ${player.Name} assigned to ${teamName} for ${price} tokens!`);

    } catch (error) {
      console.error('Failed to assign unsold player:', error);
      toast.error('Failed to assign player');
      throw error;
    }
  };

  const handleExportResults = () => {
    try {
      const fileName = exportAuctionResults(auctionState.teams, auctionState.auctionHistory, auctionState.unsoldPlayers);
      toast.success(`📊 Auction results exported as ${fileName}`);
    } catch (error) {
      console.error('Failed to export results:', error);
      toast.error('Failed to export results');
    }
  };

  const currentPlayer = auctionState.auctionStarted && auctionState.currentPlayerIdx < auctionState.players.length
    ? auctionState.players[auctionState.currentPlayerIdx]
    : null;

  const isAuctionComplete = auctionState.currentPlayerIdx >= auctionState.players.length;
  const totalSold = auctionState.auctionHistory.length;
  const totalUnsold = auctionState.unsoldPlayers.length;


  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gradient-to-br from-teal-600 via-emerald-600 to-green-800">
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={200}
          />
        )}
        
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-4">
              <motion.img 
                src="/assets/images/cpl.png" 
                alt="CPL Logo" 
                className="h-24 w-auto"
                whileHover={{ scale: 1.05 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">CPL Digital Auction</h1>
            <p className="text-emerald-100 text-lg">Cricket Premier League Player Bidding System</p>
          </motion.div>

        {!auctionState.auctionStarted ? (
          <AuctionSetup
            auctionState={auctionState}
            setAuctionState={setAuctionState}
            loadAuctionData={loadAuctionData}
            startAuction={startAuction}
            loading={loading}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="auction-container rounded-xl p-4 md:p-6 shadow-2xl"
          >
            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 bg-white/10 p-2 rounded-lg">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('auction')}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg ${
                  activeTab === 'auction'
                    ? 'bg-white text-teal-600 shadow-xl'
                    : 'text-emerald-300 hover:bg-white/20 hover:text-white shadow-md'
                }`}
              >
                <Target size={20} />
                <span className="hidden sm:inline">Live Auction</span>
                <span className="sm:hidden">Live</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('unsold')}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg ${
                  activeTab === 'unsold'
                    ? 'bg-white text-teal-600 shadow-xl'
                    : 'text-emerald-300 hover:bg-white/20 hover:text-white shadow-md'
                }`}
              >
                <Eye size={20} />
                <span className="hidden sm:inline">Unsold Players</span>
                <span className="sm:hidden">Unsold</span>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {auctionState.unsoldPlayers.length}
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg ${
                  activeTab === 'history'
                    ? 'bg-white text-teal-600 shadow-xl'
                    : 'text-emerald-300 hover:bg-white/20 hover:text-white shadow-md'
                }`}
              >
                <History size={20} />
                <span className="hidden sm:inline">Auction History</span>
                <span className="sm:hidden">History</span>
              </motion.button>
              
              <div className="ml-auto flex items-center gap-2 md:gap-4">
                <div className="text-white text-xs md:text-sm">
                  <span className="font-semibold hidden md:inline">Progress:</span>
                  <span className="md:hidden">📊</span> {totalSold + totalUnsold}/{auctionState.players.length}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportResults}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                >
                  <Download size={16} />
                  <span className="hidden md:inline">Export</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetAuction}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md hover:shadow-lg"
                >
                  <RotateCcw size={16} />
                  <span className="hidden md:inline">Reset</span>
                </motion.button>
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'auction' && (
                <motion.div
                  key="auction"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* 1. Live Auction - First Priority */}
                  <LiveAuction
                    currentPlayer={currentPlayer}
                    teams={auctionState.teams}
                    isAuctionComplete={isAuctionComplete}
                    sellPlayer={sellPlayer}
                    markUnsold={markUnsold}
                    auctionHistory={auctionState.auctionHistory}
                    roleEmojis={ROLE_EMOJIS}
                  />
                  
                  {/* 2. Team Dashboards - Second Priority */}
                  <div className="mt-8">
                    <TeamDashboard teams={auctionState.teams} />
                  </div>
                  
                  {/* 3. Auction Progress - Third Priority */}
                  <div className="mt-8">
                    <AuctionProgress
                      players={auctionState.players}
                      currentPlayerIdx={auctionState.currentPlayerIdx}
                      auctionHistory={auctionState.auctionHistory}
                      unsoldPlayers={auctionState.unsoldPlayers}
                      isComplete={isAuctionComplete}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'unsold' && (
                <motion.div
                  key="unsold"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <UnsoldPlayers
                    unsoldPlayers={auctionState.unsoldPlayers}
                    teams={auctionState.teams}
                    isAuctionComplete={isAuctionComplete}
                    assignUnsoldPlayer={assignUnsoldPlayer}
                    roleEmojis={ROLE_EMOJIS}
                  />
                  
                  {/* Team Dashboards for Unsold Tab */}
                  <div className="mt-8">
                    <TeamDashboard teams={auctionState.teams} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AuctionHistory auctionHistory={auctionState.auctionHistory} />
                  
                  {/* Team Dashboards for History Tab */}
                  <div className="mt-8">
                    <TeamDashboard teams={auctionState.teams} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        </div>
      </div>
    </NotificationProvider>
  );
}

export default App;