import React from 'react';
import { Coins, Users } from 'lucide-react';

const ROLE_EMOJIS = {
  'Batsman': '🏏',
  'Bowler': '🎯',
  'WicketKeeper': '🧤',
  'All-rounder': '⚡'
};

const TeamDashboard = ({ teams }) => {
  const teamEntries = Object.entries(teams);
  
  if (teamEntries.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Users size={24} />
        Team Dashboards
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teamEntries.map(([teamName, teamData]) => (
          <div key={teamName} className="team-card rounded-lg p-4 text-white shadow-lg">
            <div className="text-center mb-3">
              {teamData.logo && (
                <img
                  src={`/assets/images/${teamData.logo}`}
                  alt={`${teamName} logo`}
                  className="w-16 h-16 mx-auto mb-2 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <h3 className="font-bold text-lg">{teamName}</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Coins size={16} />
                  Tokens Left
                </span>
                <span className="font-bold">
                  🪙 {teamData.tokensLeft}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  Squad
                </span>
                <span className="font-bold">
                  {teamData.squad?.length || 0}/{teamData.maxSquadSize}
                </span>
              </div>
              
              {/* Role breakdown */}
              <div className="mt-3 pt-2 border-t border-white/20">
                <div className="text-xs opacity-90 mb-1">Squad Composition:</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(teamData.roleCount || {}).map(([role, count]) => (
                    count > 0 && (
                      <span key={role} className="text-xs bg-white/20 px-2 py-1 rounded">
                        {ROLE_EMOJIS[role]}{count}
                      </span>
                    )
                  ))}
                  {(!teamData.squad || teamData.squad.length === 0) && (
                    <span className="text-xs opacity-70">No players yet</span>
                  )}
                </div>
              </div>
              
              {/* Category Budgets */}
              {teamData.categoryBudgets && (
                <div className="mt-3 pt-2 border-t border-white/20">
                  <div className="text-xs opacity-90 mb-2">Category Budgets:</div>
                  <div className="space-y-1">
                    {Object.entries(teamData.categoryBudgets).map(([role, budget]) => (
                      <div key={role} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1">
                          {ROLE_EMOJIS[role]}
                          <span className="truncate">{role}</span>
                        </span>
                        <span className={`font-medium ${budget.remaining < 50 ? 'text-red-200' : 'text-white'}`}>
                          🪙 {budget.remaining}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tokens spent indicator */}
              <div className="mt-2">
                <div className="text-xs opacity-90 mb-1">
                  Spent: 🪙 {teamData.maxTokens - teamData.tokensLeft}
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{
                      width: `${((teamData.maxTokens - teamData.tokensLeft) / teamData.maxTokens) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamDashboard;