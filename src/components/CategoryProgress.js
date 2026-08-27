import React from 'react';
import { motion } from 'framer-motion';
import { getCurrentAuctionPhase, getCategoryStatistics, ROLE_ORDER, ROLE_EMOJIS } from '../utils/auctionUtils';

const CategoryProgress = ({ players, currentPlayerIdx, teams }) => {
  const currentPhase = getCurrentAuctionPhase(players, currentPlayerIdx);
  const categoryStats = getCategoryStatistics(teams);

  if (!currentPhase) return null;

  return (
    <div className="bg-white/80 rounded-xl p-6 shadow-lg">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          {currentPhase.emoji} {currentPhase.phaseName}
          <span className="text-sm font-normal text-gray-600">
            (Phase {currentPhase.phase}/{currentPhase.totalPhases})
          </span>
        </h3>

        {/* Current Category Progress */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Category Progress: {currentPhase.categoryProgress.current}/{currentPhase.categoryProgress.total} players
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(currentPhase.categoryProgress.percentage)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${currentPhase.categoryProgress.percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Category stats */}
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-700">Players Needed</div>
              <div className="text-green-600">{currentPhase.shape.minPlayers}-{currentPhase.shape.maxPlayers}</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-700">Total Spent</div>
              <div className="text-purple-600">🪙 {categoryStats[currentPhase.role]?.totalSpent || 0}</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-700">Avg Price</div>
              <div className="text-orange-600">🪙 {Math.round(categoryStats[currentPhase.role]?.averagePrice || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* All Categories Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROLE_ORDER.map((role, index) => {
          const isCurrentPhase = role === currentPhase.role;
          const isCompleted = index < ROLE_ORDER.indexOf(currentPhase.role);
          const stats = categoryStats[role];

          return (
            <motion.div
              key={role}
              className={`rounded-lg p-4 border-2 transition-all ${
                isCurrentPhase
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : isCompleted
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{ROLE_EMOJIS[role]}</div>
                <div className="font-semibold text-gray-800 mb-1">{role}s</div>

                {/* Phase Status */}
                <div className={`text-xs px-2 py-1 rounded-full mb-2 ${
                  isCurrentPhase
                    ? 'bg-blue-200 text-blue-800'
                    : isCompleted
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {isCurrentPhase ? 'Current' : isCompleted ? 'Completed' : 'Upcoming'}
                </div>

                {/* Stats */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Spent:</span>
                    <span className="font-medium text-purple-600">🪙 {stats?.totalSpent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Players:</span>
                    <span className="font-medium text-green-600">{stats?.totalPlayers || 0}</span>
                  </div>
                  {stats?.totalPlayers > 0 && (
                    <div className="flex justify-between">
                      <span>Avg:</span>
                      <span className="font-medium text-orange-600">🪙 {Math.round(stats.averagePrice)}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryProgress;
