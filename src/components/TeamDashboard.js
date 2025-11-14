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
  
  // Debug: Log team logos (must be before early return)
  React.useEffect(() => {
    if (teamEntries.length > 0) {
      console.log('Team logos:', teamEntries.map(([name, data]) => ({ 
        team: name, 
        logo: data.logo,
        logoPath: data.logo ? `/${data.logo}` : 'No logo'
      })));
    }
  }, [teamEntries]);
  
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
          <div 
            key={teamName} 
            className="team-card rounded-lg p-4 text-white shadow-lg relative overflow-hidden"
          >
            {/* Background gradient first */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-700/80 to-green-800/80 rounded-lg"></div>
            
            {/* Logo overlay on top of gradient */}
            {teamData.logo && (
              <div 
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundImage: `url(/${teamData.logo})`,
                  backgroundSize: '150px 150px',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center center',
                  opacity: 0.4,
                  zIndex: 5
                }}
              />
            )}
            
            {/* Content with highest z-index */}
            <div className="relative z-20">
              <div className="text-center mb-3">
                {/* Team identifier with logo or initials */}
                <div className="flex justify-between items-start mb-2">
                  {teamData.logo ? (
                    <div className="relative group">
                      <img
                        src={`/${teamData.logo}`}
                        alt={`${teamName} logo`}
                        className="w-8 h-8 rounded-full object-cover opacity-90 border border-white/30 cursor-pointer transition-all duration-300 group-hover:scale-150 group-hover:z-50 group-hover:shadow-2xl group-hover:border-white/60"
                        onError={(e) => {
                          // Fallback to team initials
                          e.target.outerHTML = `<div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold border border-white/30 cursor-pointer transition-all duration-300 hover:scale-150 hover:z-50 hover:shadow-2xl hover:border-white/60">${teamName.split(' ').map(word => word[0]).join('').substring(0, 2)}</div>`;
                        }}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50">
                        {teamName}
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold border border-white/30 cursor-pointer transition-all duration-300 group-hover:scale-150 group-hover:z-50 group-hover:shadow-2xl group-hover:border-white/60">
                        {teamName.split(' ').map(word => word[0]).join('').substring(0, 2)}
                      </div>
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50">
                        {teamName}
                      </div>
                    </div>
                  )}
                  <div className="text-xs opacity-70">
                    {teamData.squad?.length || 0}/{teamData.maxSquadSize}
                  </div>
                </div>
                <h3 className="font-bold text-lg text-white drop-shadow-lg">{teamName}</h3>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamDashboard;