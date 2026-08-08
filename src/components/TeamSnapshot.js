import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Shield } from 'lucide-react';

const TeamSnapshot = ({ teams = {}, currentPhase = 'retention' }) => {
  const teamArray = Object.entries(teams).map(([name, data]) => ({
    name,
    logo: data.logo,
    tokensLeft: data.tokensLeft || 0,
    maxTokens: data.maxTokens || 1200,
    squad: data.squad || [],
    retainedPlayers: data.squad?.filter(p => p.IsRetained) || [],
    totalPlayers: data.squad?.length || 0,
    roleCount: data.roleCount || {}
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Shield size={28} className="text-teal-600" />
        Team Snapshots
      </h2>

      {teamArray.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300"
        >
          <Users size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 text-lg">No teams initialized yet</p>
          <p className="text-gray-500 text-sm">Teams will appear here once data is loaded</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamArray.map((team, index) => {
            const spentTokens = team.maxTokens - team.tokensLeft;
            const spentPercentage = (spentTokens / team.maxTokens) * 100;

            return (
              <motion.div
                key={team.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white rounded-lg shadow-md border-2 border-gray-100 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Team Header */}
                <motion.div
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 text-white"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {/* Team Logo */}
                    {team.logo ? (
                      <img
                        src={`/public/${team.logo}`}
                        alt={team.name}
                        className="w-8 h-8 rounded-full bg-white p-1 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-teal-600 font-bold text-xs">
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm">{team.name}</h3>
                      <p className="text-xs opacity-90">{team.totalPlayers} Players</p>
                    </div>
                  </div>
                </motion.div>

                {/* Team Body */}
                <div className="p-4 space-y-3">
                  {/* Retained Players (if in retention phase) */}
                  {currentPhase === 'retention' && team.retainedPlayers.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="text-xs font-semibold text-red-700 mb-2">
                        🔒 Retained ({team.retainedPlayers.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {team.retainedPlayers.slice(0, 3).map((player, idx) => (
                          <motion.div
                            key={idx}
                            title={player.Name}
                            className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold cursor-help"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            {player.Name.substring(0, 1).toUpperCase()}
                          </motion.div>
                        ))}
                        {team.retainedPlayers.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-red-300 text-red-800 text-xs flex items-center justify-center font-bold">
                            +{team.retainedPlayers.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Budget Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <DollarSign size={14} />
                        <span>Purse</span>
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        🪙 {team.tokensLeft.toLocaleString()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${spentPercentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>🪙 {spentTokens.toLocaleString()} spent</span>
                      <span>{Math.round(spentPercentage)}%</span>
                    </div>
                  </div>

                  {/* Role Distribution */}
                  {team.roleCount && Object.keys(team.roleCount).length > 0 && (
                    <div className="grid grid-cols-2 gap-1 text-xs bg-gray-50 rounded-lg p-2 border border-gray-200">
                      {Object.entries(team.roleCount).map(([role, count]) => (
                        <div key={role} className="text-center">
                          <span className="block font-semibold text-gray-700">{count}</span>
                          <span className="block text-gray-600 truncate">{role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default TeamSnapshot;
