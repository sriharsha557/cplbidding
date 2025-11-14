import React, { useState, useEffect } from 'react';
import { Eye, Users, Trophy, TrendingUp, Clock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TeamDashboard from './TeamDashboard';
import CategoryProgress from './CategoryProgress';
import AuctionProgress from './AuctionProgress';
import { getCurrentAuctionPhase, ROLE_EMOJIS } from '../utils/auctionUtils';

const HomePage = ({ auctionState }) => {
  const [activeView, setActiveView] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentPlayer = auctionState.auctionStarted && auctionState.currentPlayerIdx < auctionState.players.length
    ? auctionState.players[auctionState.currentPlayerIdx]
    : null;

  const currentPhase = currentPlayer ? getCurrentAuctionPhase(auctionState.players, auctionState.currentPlayerIdx) : null;
  const isAuctionComplete = auctionState.currentPlayerIdx >= auctionState.players.length;
  const totalSold = auctionState.auctionHistory.length;
  const totalUnsold = auctionState.unsoldPlayers.length;
  const totalProcessed = totalSold + totalUnsold;
  const totalPlayers = auctionState.players.length;

  // Calculate team statistics
  const teamStats = Object.entries(auctionState.teams).map(([name, data]) => ({
    name,
    players: data.squad?.length || 0,
    tokensLeft: data.tokensLeft || 0,
    tokensSpent: (data.maxTokens || 0) - (data.tokensLeft || 0),
    avgPrice: data.squad?.length > 0 ? Math.round(((data.maxTokens || 0) - (data.tokensLeft || 0)) / data.squad.length) : 0
  })).sort((a, b) => b.tokensSpent - a.tokensSpent);

  if (!auctionState.auctionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 via-emerald-600 to-green-800 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white p-8"
        >
          {/* Colruyt Group Logo - Prominent on Landing */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <img 
              src="/Colruyt_Group.png" 
              alt="Colruyt Group" 
              className="h-24 md:h-32 w-auto mx-auto mb-4"
              onError={(e) => {
                console.error('Colruyt Group logo not found');
                e.target.style.display = 'none';
              }}
            />
          </motion.div>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="mb-8"
          >
            <Trophy size={80} className="mx-auto text-yellow-400" />
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">CPL Auction 2025</h1>
          <p className="text-xl md:text-2xl mb-8 text-emerald-100">
            Cricket Premier League Digital Bidding System
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">🏏 Auction Status</h2>
            <div className="text-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock size={20} />
                <span>Auction Not Started</span>
              </div>
              <div className="text-emerald-200">
                Waiting for auction administrator to begin...
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Users size={32} className="mx-auto mb-2 text-blue-300" />
              <div className="text-lg font-semibold">Teams Ready</div>
              <div className="text-2xl font-bold">{Object.keys(auctionState.teams).length}</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Star size={32} className="mx-auto mb-2 text-yellow-300" />
              <div className="text-lg font-semibold">Players Available</div>
              <div className="text-2xl font-bold">{auctionState.players.length}</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Trophy size={32} className="mx-auto mb-2 text-green-300" />
              <div className="text-lg font-semibold">Total Budget</div>
              <div className="text-2xl font-bold">🪙 {(auctionState.maxTokens * Object.keys(auctionState.teams).length).toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-8 text-emerald-200">
            <p>🔄 This page will automatically update when the auction begins</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-emerald-600 to-green-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          {/* Colruyt Group Logo - Prominent Display */}
          <div className="flex justify-center mb-6">
            <motion.img 
              src="/Colruyt_Group.png" 
              alt="Colruyt Group" 
              className="h-20 md:h-24 w-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              onError={(e) => {
                console.error('Colruyt Group logo not found');
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* CPL Logo - Secondary */}
          <div className="flex justify-center mb-4">
            <motion.img 
              src="/assets/images/cpl.png" 
              alt="CPL Logo" 
              className="h-14 w-auto"
              whileHover={{ scale: 1.05 }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">CPL Live Auction</h1>
          <div className="text-emerald-100 text-sm">
            {currentTime.toLocaleString()} | Live Updates
          </div>
        </motion.div>

        {/* Quick Stats Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-6 shadow-lg"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-teal-600">{totalProcessed}/{totalPlayers}</div>
              <div className="text-sm text-gray-600">Players Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalSold}</div>
              <div className="text-sm text-gray-600">Players Sold</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{totalUnsold}</div>
              <div className="text-sm text-gray-600">Unsold Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {currentPhase ? `${currentPhase.phase}/4` : 'Complete'}
              </div>
              <div className="text-sm text-gray-600">Auction Phase</div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white/10 p-2 rounded-lg">
          {[
            { id: 'overview', label: 'Live Overview', icon: Eye },
            { id: 'teams', label: 'Team Status', icon: Users },
            { id: 'progress', label: 'Category Progress', icon: TrendingUp },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView(id)}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg ${
                activeView === id
                  ? 'bg-white text-teal-600 shadow-xl'
                  : 'text-emerald-300 hover:bg-white/20 hover:text-white shadow-md'
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {isAuctionComplete ? (
                <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-xl">
                  <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">🎊 Auction Complete!</h2>
                  <p className="text-gray-600 mb-6">All players have been processed</p>
                  
                  <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{totalSold}</div>
                      <div className="text-sm text-green-700">Players Sold</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-600">{totalUnsold}</div>
                      <div className="text-sm text-orange-700">Unsold Players</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        🪙 {auctionState.auctionHistory.reduce((sum, h) => sum + h.SoldPrice, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-700">Total Spent</div>
                    </div>
                  </div>
                </div>
              ) : currentPlayer ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Eye size={24} />
                    Current Player on Auction
                  </h2>

                  {/* Current Phase Info */}
                  {currentPhase && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-blue-800 mb-2">
                          {currentPhase.emoji} {currentPhase.phaseName}
                        </h3>
                        <div className="text-sm text-blue-600">
                          Phase {currentPhase.phase}/{currentPhase.totalPhases} | 
                          Progress: {currentPhase.categoryProgress.current}/{currentPhase.categoryProgress.total} players 
                          ({Math.round(currentPhase.categoryProgress.percentage)}%)
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${currentPhase.categoryProgress.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Current Player Card */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="text-center">
                      <img
                        src={currentPlayer.PhotoFileName ? `/assets/images/${currentPlayer.PhotoFileName}` : '/placeholder-player.svg'}
                        alt={currentPlayer.Name}
                        className="w-48 h-48 mx-auto mb-4 rounded-full object-cover border-4 border-teal-200 bg-gray-100"
                        onError={(e) => {
                          e.target.src = '/placeholder-player.svg';
                        }}
                      />
                      
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{currentPlayer.Name}</h3>
                      <p className="text-lg text-gray-600 mb-2">
                        {ROLE_EMOJIS[currentPlayer.Role]} {currentPlayer.Role}
                      </p>
                      <p className="text-xl font-bold text-teal-600">
                        Base Price: {currentPlayer.BaseTokens} 🪙
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Player ID: {currentPlayer.PlayerID}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Bidding Status</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Current Phase:</span>
                            <span className="font-medium">{currentPhase?.phaseName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Base Price:</span>
                            <span className="font-medium">🪙 {currentPlayer.BaseTokens}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Player #{currentPhase?.categoryProgress.current || 0}:</span>
                            <span className="font-medium">of {currentPhase?.categoryProgress.total || 0} {currentPlayer.Role}s</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={16} className="text-yellow-600" />
                          <span className="font-medium text-yellow-800">Bidding in Progress</span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          Teams are currently placing bids for this player. 
                          The result will appear here once bidding is complete.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-xl">
                  <Clock size={64} className="mx-auto text-gray-400 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-600">Auction in Progress</h2>
                  <p className="text-gray-500">Waiting for next player...</p>
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'teams' && (
            <motion.div
              key="teams"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <TeamDashboard teams={auctionState.teams} />
            </motion.div>
          )}

          {activeView === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <CategoryProgress 
                players={auctionState.players}
                currentPlayerIdx={auctionState.currentPlayerIdx}
                teams={auctionState.teams}
                auctionHistory={auctionState.auctionHistory}
              />
              
              <div className="mt-6">
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

          {activeView === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Trophy size={24} />
                Team Leaderboard
              </h2>

              <div className="space-y-4">
                {teamStats.map((team, index) => (
                  <motion.div
                    key={team.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      index === 0 ? 'border-yellow-300 bg-yellow-50' :
                      index === 1 ? 'border-gray-300 bg-gray-50' :
                      index === 2 ? 'border-orange-300 bg-orange-50' :
                      'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-500 text-white' :
                        index === 2 ? 'bg-orange-500 text-white' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{team.name}</div>
                        <div className="text-sm text-gray-600">
                          {team.players} players | Avg: 🪙 {team.avgPrice}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg text-purple-600">
                        🪙 {team.tokensSpent.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        🪙 {team.tokensLeft.toLocaleString()} left
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Recent Transactions */}
              {auctionState.auctionHistory.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                  <div className="space-y-2">
                    {auctionState.auctionHistory.slice(-5).reverse().map((transaction, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-lg">{ROLE_EMOJIS[transaction.Role]}</div>
                          <div>
                            <div className="font-medium text-gray-800">{transaction.Player}</div>
                            <div className="text-sm text-gray-600">{transaction.Role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">🪙 {transaction.SoldPrice}</div>
                          <div className="text-sm text-gray-600">{transaction.Team}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-emerald-100 text-sm"
        >
          <p>🔄 Live updates every few seconds | 👥 Public viewing page</p>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;