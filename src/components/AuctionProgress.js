import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target } from 'lucide-react';
import { getCurrentAuctionPhase, calculateAuctionProgress, ROLE_ORDER, ROLE_EMOJIS } from '../utils/auctionUtils';

const AuctionProgress = ({ 
  players, 
  currentPlayerIdx, 
  auctionHistory, 
  unsoldPlayers,
  isComplete 
}) => {
  const progress = calculateAuctionProgress(players, currentPlayerIdx, auctionHistory.length, unsoldPlayers.length);
  const currentPhase = getCurrentAuctionPhase(players, currentPlayerIdx);

  const getRoleProgress = (role) => {
    const rolePlayersTotal = players.filter(p => p.Role === role).length;
    const roleSold = auctionHistory.filter(h => h.Role === role).length;
    const roleUnsold = unsoldPlayers.filter(p => p.Role === role).length;
    const roleProcessed = roleSold + roleUnsold;
    
    return {
      total: rolePlayersTotal,
      processed: roleProcessed,
      sold: roleSold,
      unsold: roleUnsold,
      percentage: rolePlayersTotal > 0 ? (roleProcessed / rolePlayersTotal) * 100 : 0
    };
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 mb-6">
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Target size={20} />
            Auction Progress
          </h3>
          <div className="text-sm text-gray-600">
            {progress.processed}/{progress.total} players processed
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <motion.div
            className="bg-gradient-to-r from-teal-500 to-emerald-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>🎯 Sold: {progress.sold}</span>
          <span>❌ Unsold: {progress.unsold}</span>
          <span>⏳ Remaining: {progress.remaining}</span>
        </div>
      </div>

      {/* Current Phase */}
      {currentPhase && !isComplete && (
        <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{currentPhase.emoji}</div>
            <div>
              <h4 className="font-semibold text-teal-800">{currentPhase.phaseName}</h4>
              <p className="text-sm text-teal-600">
                Phase {currentPhase.phase} of {currentPhase.totalPhases}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Role-wise Progress */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLE_ORDER.map(role => {
          const roleProgress = getRoleProgress(role);
          
          return (
            <div key={role} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{ROLE_EMOJIS[role]}</span>
                <span className="text-sm font-medium text-gray-700">{role}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <motion.div
                  className={`h-2 rounded-full ${
                    role === currentPhase?.role 
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500' 
                      : 'bg-gray-400'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${roleProgress.percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              
              <div className="text-xs text-gray-600">
                <div>{roleProgress.processed}/{roleProgress.total}</div>
                <div className="flex justify-between">
                  <span>✅ {roleProgress.sold}</span>
                  <span>❌ {roleProgress.unsold}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Status */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 text-center"
        >
          <Trophy size={32} className="mx-auto text-green-600 mb-2" />
          <h4 className="font-semibold text-green-800 mb-1">🎊 Auction Complete!</h4>
          <p className="text-sm text-green-600">
            All {progress.total} players have been processed
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default AuctionProgress;