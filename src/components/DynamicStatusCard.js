import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { LEAGUE_PHASES, formatCountdown } from '../utils/leaguePhaseUtils';

const DynamicStatusCard = ({
  currentPhase = 'retention',
  retentionDeadline = null,
  tradingDeadline = null,
  retentionStats = {},
  tradingStats = {},
  auctionStats = {}
}) => {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      let deadline = null;
      if (currentPhase === 'retention' && retentionDeadline) {
        deadline = retentionDeadline;
      } else if (currentPhase === 'trading' && tradingDeadline) {
        deadline = tradingDeadline;
      }
      
      if (deadline) {
        setCountdown(formatCountdown(deadline));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPhase, retentionDeadline, tradingDeadline]);

  const phaseConfig = LEAGUE_PHASES[currentPhase.toUpperCase()];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-6 shadow-lg border-2 mb-6 ${
        phaseConfig?.bgColor || 'bg-gray-50'
      } ${phaseConfig?.borderColor || 'border-gray-300'}`}
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Phase & Countdown */}
        <motion.div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{phaseConfig?.emoji}</span>
            <div>
              <h2 className={`text-2xl font-bold ${phaseConfig?.textColor}`}>
                {phaseConfig?.name} Phase Live
              </h2>
              <p className="text-sm text-gray-600">{phaseConfig?.description}</p>
            </div>
          </div>

          {/* Countdown */}
          {(currentPhase === 'retention' && retentionDeadline) ||
           (currentPhase === 'trading' && tradingDeadline) ? (
            <div className="bg-white/50 rounded-lg p-4 flex items-center gap-3">
              <Clock className={`${phaseConfig?.textColor}`} size={24} />
              <div>
                <div className="text-sm text-gray-600">Deadline Countdown</div>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`text-2xl font-bold ${phaseConfig?.textColor}`}
                >
                  {countdown || 'Calculating...'}
                </motion.div>
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Right: Phase-Specific Stats */}
        <motion.div className="space-y-3">
          <AnimatePresence mode="wait">
            {currentPhase === 'retention' && (
              <motion.div
                key="retention-stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-gray-700">Teams Submitted</span>
                  <span className="text-lg font-bold text-green-600">
                    {retentionStats.teamsSubmitted || 0}/{retentionStats.teamsTotal || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-gray-700">Players Retained</span>
                  <span className="text-lg font-bold text-blue-600">
                    {retentionStats.totalPlayersRetained || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-gray-700">Purse Remaining</span>
                  <span className="text-lg font-bold text-purple-600">
                    🪙 {(retentionStats.totalPurseRemaining || 0).toLocaleString()}
                  </span>
                </div>

                {retentionStats.teamsSubmitted === retentionStats.teamsTotal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-green-700 bg-green-100 rounded-lg p-3"
                  >
                    <CheckCircle size={18} />
                    <span className="text-sm font-semibold">All teams submitted</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {currentPhase === 'trading' && (
              <motion.div
                key="trading-stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-gray-700">Total Trades</span>
                  <span className="text-lg font-bold text-blue-600">
                    {tradingStats.totalTrades || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-gray-700">Pending Approvals</span>
                  <motion.span
                    animate={tradingStats.pendingApprovals > 0 ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-lg font-bold text-orange-600"
                  >
                    {tradingStats.pendingApprovals || 0}
                  </motion.span>
                </div>

                <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-gray-700">Most Active</span>
                  <span className="text-lg font-bold text-teal-600">
                    {tradingStats.mostActiveTeam ? `${tradingStats.mostActiveTeam} (${tradingStats.mostActiveTeamTrades})` : 'N/A'}
                  </span>
                </div>

                {tradingStats.pendingApprovals > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-orange-700 bg-orange-100 rounded-lg p-3"
                  >
                    <AlertCircle size={18} />
                    <span className="text-sm font-semibold">Awaiting approvals</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {currentPhase === 'auction' && (
              <motion.div
                key="auction-stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-gray-700">Processed Players</span>
                  <span className="text-lg font-bold text-green-600">
                    {auctionStats.processed || 0}/{auctionStats.total || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-gray-700">Players Sold</span>
                  <span className="text-lg font-bold text-blue-600">
                    {auctionStats.sold || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <motion.span
                    className="text-lg font-bold text-purple-600"
                  >
                    {auctionStats.total > 0 ? Math.round((auctionStats.processed / auctionStats.total) * 100) : 0}%
                  </motion.span>
                </div>

                {auctionStats.processed === auctionStats.total && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-emerald-700 bg-emerald-100 rounded-lg p-3"
                  >
                    <CheckCircle size={18} />
                    <span className="text-sm font-semibold">🏆 Auction Complete!</span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DynamicStatusCard;
