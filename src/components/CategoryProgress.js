import React from 'react';
import { motion } from 'framer-motion';
import { getCurrentAuctionPhase, getCategoryStatistics, ROLE_ORDER, ROLE_EMOJIS, CPL_CATEGORY_BUDGETS } from '../utils/auctionUtils';

const CategoryProgress = ({ players, currentPlayerIdx, teams, auctionHistory }) => {
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
          
          {/* Category Budget Info */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-700">Budget Range</div>
              <div className="text-blue-600">🪙 {currentPhase.budget.min}-{currentPhase.budget.max}</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-700">Players Needed</div>
              <div className="text-green-600">{currentPhase.budget.minPlayers}-{currentPhase.budget.maxPlayers}</div>
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
                    <span>Budget:</span>
                    <span className="font-medium">🪙 {CPL_CATEGORY_BUDGETS[role].min}-{CPL_CATEGORY_BUDGETS[role].max}</span>
                  </div>
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

      {/* Team Category Budgets */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Team Category Budgets</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-700">Team</th>
                {ROLE_ORDER.map(role => (
                  <th key={role} className="text-center py-2 px-3 font-medium text-gray-700">
                    {ROLE_EMOJIS[role]} {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(teams).map(([teamName, teamData]) => (
                <tr key={teamName} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{teamName}</td>
                  {ROLE_ORDER.map(role => {
                    const categoryBudget = teamData.categoryBudgets?.[role];
                    const playerCount = teamData.roleCount[role];
                    
                    return (
                      <td key={role} className="text-center py-2 px-3">
                        {categoryBudget ? (
                          <div className="space-y-1">
                            <div className={`text-xs px-2 py-1 rounded ${
                              categoryBudget.remaining > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              🪙 {categoryBudget.remaining}
                            </div>
                            <div className="text-xs text-gray-600">
                              {playerCount}/{CPL_CATEGORY_BUDGETS[role].maxPlayers} players
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryProgress;