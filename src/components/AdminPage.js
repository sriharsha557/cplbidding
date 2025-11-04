import React, { useState } from 'react';
import { Target, History, Eye, RotateCcw, Download, Settings, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';

import AuctionSetup from './AuctionSetup';
import LiveAuction from './LiveAuction';
import UnsoldPlayers from './UnsoldPlayers';
import AuctionHistory from './AuctionHistory';
import TeamDashboard from './TeamDashboard';
import AuctionProgress from './AuctionProgress';
import PlayerValuation from './PlayerValuation';

import { ROLE_EMOJIS } from '../utils/auctionUtils';
import { exportAuctionResults } from '../utils/excelExport';

const AdminPage = ({ 
  auctionState, 
  setAuctionState,
  loadAuctionData,
  startAuction,
  resetAuction,
  sellPlayer,
  markUnsold,
  assignUnsoldPlayer,
  loading,
  showConfetti,
  windowSize
}) => {
  const [activeTab, setActiveTab] = useState('auction');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // Simple admin authentication (you can enhance this)
  const ADMIN_PASSWORD = 'cpl2025admin'; // Change this to your preferred password

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('🔓 Admin access granted');
    } else {
      toast.error('❌ Invalid admin password');
      setAdminPassword('');
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

  // Admin login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full mx-4"
        >
          <div className="text-center mb-8">
            <Lock size={48} className="mx-auto text-gray-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Access Required</h1>
            <p className="text-gray-600">Enter admin password to access auction controls</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>

            <button
              onClick={handleAdminLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Lock size={20} />
              Access Admin Panel
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>🔒 Secure admin access for auction management</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900">
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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">CPL Admin Panel</h1>
          <p className="text-gray-300 text-lg flex items-center justify-center gap-2">
            <Settings size={20} />
            Auction Management & Control Center
          </p>
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
            className="auction-container rounded-xl p-4 md:p-6 shadow-2xl bg-white/95 backdrop-blur-sm"
          >
            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 bg-gray-100 p-2 rounded-lg">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('auction')}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg ${
                  activeTab === 'auction'
                    ? 'bg-blue-600 text-white shadow-xl'
                    : 'text-gray-600 hover:bg-white hover:text-gray-800 shadow-md'
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
                    ? 'bg-blue-600 text-white shadow-xl'
                    : 'text-gray-600 hover:bg-white hover:text-gray-800 shadow-md'
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
                    ? 'bg-blue-600 text-white shadow-xl'
                    : 'text-gray-600 hover:bg-white hover:text-gray-800 shadow-md'
                }`}
              >
                <History size={20} />
                <span className="hidden sm:inline">Auction History</span>
                <span className="sm:hidden">History</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('valuation')}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg ${
                  activeTab === 'valuation'
                    ? 'bg-blue-600 text-white shadow-xl'
                    : 'text-gray-600 hover:bg-white hover:text-gray-800 shadow-md'
                }`}
              >
                <Settings size={20} />
                <span className="hidden sm:inline">Player Valuation</span>
                <span className="sm:hidden">Valuation</span>
              </motion.button>
              
              <div className="ml-auto flex items-center gap-2 md:gap-4">
                <div className="text-gray-700 text-xs md:text-sm">
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

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAuthenticated(false)}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-md hover:shadow-lg"
                >
                  <Lock size={16} />
                  <span className="hidden md:inline">Logout</span>
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
                    players={auctionState.players}
                    currentPlayerIdx={auctionState.currentPlayerIdx}
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

              {activeTab === 'valuation' && (
                <motion.div
                  key="valuation"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PlayerValuation 
                    onPriceCalculated={(playerData) => {
                      toast.success(`💰 Base price calculated: ${playerData.basePrice} tokens for ${playerData.name}`);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;