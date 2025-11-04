import React, { useState, useEffect } from 'react';
import { Settings, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

import HomePage from './components/HomePage';
import AdminPage from './components/AdminPage';
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
    maxTokens: 1200, // Updated to new budget
    maxSquadSize: 15
  });

  const [currentView, setCurrentView] = useState('home'); // 'home' or 'admin'
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
              'Batsman': { spent: 0, remaining: 420, min: 294, max: 420, minPlayers: 4, maxPlayers: 5 },
              'Bowler': { spent: 0, remaining: 420, min: 294, max: 420, minPlayers: 4, maxPlayers: 5 },
              'All-rounder': { spent: 0, remaining: 240, min: 168, max: 240, minPlayers: 3, maxPlayers: 4 },
              'WicketKeeper': { spent: 0, remaining: 120, min: 84, max: 120, minPlayers: 2, maxPlayers: 3 }
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

  return (
    <NotificationProvider>
      <div className="min-h-screen">
        {/* Navigation Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.img 
                  src="/assets/images/cpl.png" 
                  alt="CPL Logo" 
                  className="h-10 w-auto"
                  whileHover={{ scale: 1.05 }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <h1 className="text-xl font-bold text-gray-800">CPL Auction 2025</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentView('home')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    currentView === 'home'
                      ? 'bg-teal-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Home size={18} />
                  <span className="hidden sm:inline">Public View</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentView('admin')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    currentView === 'admin'
                      ? 'bg-slate-700 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings size={18} />
                  <span className="hidden sm:inline">Admin Panel</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        {currentView === 'home' ? (
          <HomePage auctionState={auctionState} />
        ) : (
          <AdminPage 
            auctionState={auctionState}
            setAuctionState={setAuctionState}
            loadAuctionData={loadAuctionData}
            startAuction={startAuction}
            resetAuction={resetAuction}
            sellPlayer={sellPlayer}
            markUnsold={markUnsold}
            assignUnsoldPlayer={assignUnsoldPlayer}
            loading={loading}
            showConfetti={showConfetti}
            windowSize={windowSize}
          />
        )}
      </div>
    </NotificationProvider>
  );
}

export default App;