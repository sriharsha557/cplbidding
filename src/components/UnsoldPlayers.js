import React, { useState } from 'react';
import { Eye, UserPlus, Download } from 'lucide-react';

const UnsoldPlayers = ({ 
  unsoldPlayers, 
  teams, 
  isAuctionComplete, 
  assignUnsoldPlayer, 
  roleEmojis 
}) => {
  // Debug logging
  console.log('UnsoldPlayers rendered:', { 
    unsoldPlayersCount: unsoldPlayers?.length || 0, 
    teamsCount: Object.keys(teams || {}).length,
    isAuctionComplete 
  });
  const [selectedPlayer, setSelectedPlayer] = useState(0);
  const [assignTeam, setAssignTeam] = useState('');
  const [assignPrice, setAssignPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (unsoldPlayers.length > 0) {
      setAssignPrice(unsoldPlayers[0]?.BaseTokens || 0);
    }
    setAssignTeam(Object.keys(teams)[0] || '');
  }, [unsoldPlayers, teams]);

  React.useEffect(() => {
    if (unsoldPlayers[selectedPlayer]) {
      setAssignPrice(unsoldPlayers[selectedPlayer].BaseTokens);
    }
  }, [selectedPlayer, unsoldPlayers]);

  const handleAssignPlayer = async () => {
    if (!assignTeam || selectedPlayer < 0) return;
    
    setLoading(true);
    try {
      await assignUnsoldPlayer(selectedPlayer, assignTeam, assignPrice);
      // Reset selection if no more players
      if (selectedPlayer >= unsoldPlayers.length - 1) {
        setSelectedPlayer(Math.max(0, unsoldPlayers.length - 2));
      }
    } catch (error) {
      alert('Failed to assign player: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadUnsold = () => {
    const csv = [
      ['Player ID', 'Name', 'Role', 'Base Tokens'],
      ...unsoldPlayers.map(p => [p.PlayerID, p.Name, p.Role, p.BaseTokens])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unsold_players.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const canAfford = (team, price) => team.tokensLeft >= price;
  const isSquadFull = (team) => team.squad.length >= team.maxSquadSize;

  return (
    <div className="min-h-[400px]">
      {/* Debug info */}
      <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mb-4 text-sm">
        <strong>Debug:</strong> UnsoldPlayers component is rendering. 
        Unsold count: {unsoldPlayers?.length || 0}, 
        Teams: {Object.keys(teams || {}).length}
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Eye size={24} />
          Unsold Players ({unsoldPlayers.length})
        </h2>
        
        {unsoldPlayers.length > 0 && (
          <button
            onClick={downloadUnsold}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            Download List
          </button>
        )}
      </div>

      {unsoldPlayers.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-lg">
          <Eye size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Unsold Players</h3>
          <p className="text-gray-500">All players have been successfully sold!</p>
        </div>
      ) : (
        <div>
          {/* Assignment Panel - Only show if auction is complete */}
          {isAuctionComplete && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <UserPlus size={20} />
                Assign Unsold Players to Teams
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                Auction is complete! You can now manually assign unsold players to teams.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Unsold Player
                  </label>
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {unsoldPlayers.map((player, idx) => (
                      <option key={idx} value={idx}>
                        {player.Name} ({player.Role})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Team
                  </label>
                  <select
                    value={assignTeam}
                    onChange={(e) => setAssignTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {Object.keys(teams).map(teamName => (
                      <option key={teamName} value={teamName}>
                        {teamName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={assignPrice}
                    onChange={(e) => setAssignPrice(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Team validation */}
              {assignTeam && teams[assignTeam] && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className={`p-3 rounded-lg text-center ${
                    canAfford(teams[assignTeam], assignPrice) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className="text-sm font-medium">
                      {canAfford(teams[assignTeam], assignPrice) ? '✅ Can Afford' : '❌ Insufficient Tokens'}
                    </div>
                    <div className="text-xs">
                      {teams[assignTeam].tokensLeft} tokens available
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg text-center ${
                    !isSquadFull(teams[assignTeam]) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className="text-sm font-medium">
                      {!isSquadFull(teams[assignTeam]) ? '✅ Squad Space' : '❌ Squad Full'}
                    </div>
                    <div className="text-xs">
                      {teams[assignTeam].squad.length}/{teams[assignTeam].maxSquadSize} players
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleAssignPlayer}
                disabled={loading || !assignTeam || !canAfford(teams[assignTeam], assignPrice) || isSquadFull(teams[assignTeam])}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <UserPlus size={20} />
                {loading ? 'Assigning...' : 'Assign Player to Team'}
              </button>
            </div>
          )}

          {/* Unsold Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {unsoldPlayers.map((player, idx) => (
              <div key={idx} className="unsold-card rounded-lg p-4 text-white shadow-lg">
                <div className="text-center">
                  <img
                    src={player.PhotoFileName ? `/players/${player.PhotoFileName}` : '/placeholder-player.svg'}
                    alt={player.Name}
                    className="w-20 h-20 mx-auto mb-3 rounded-full object-cover border-2 border-white/30 bg-white/20"
                    onError={(e) => {
                      e.target.src = '/placeholder-player.svg';
                    }}
                  />
                  
                  <h4 className="font-bold text-lg mb-1">{player.Name}</h4>
                  <p className="text-sm mb-2">
                    {roleEmojis[player.Role]} {player.Role}
                  </p>
                  <p className="font-semibold">
                    Base: {player.BaseTokens} 🪙
                  </p>
                  <p className="text-xs opacity-90 mt-2">
                    ID: {player.PlayerID}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnsoldPlayers;