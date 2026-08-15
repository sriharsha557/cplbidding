import React, { useState } from 'react';
import { Target, CheckCircle, SkipForward, Trophy, Download } from 'lucide-react';

import AuctionTimer from './AuctionTimer';
import CategoryProgress from './CategoryProgress';
import { validateBid, maxBidFor, needsWicketKeeper } from '../utils/bidRules';

const LiveAuction = ({ 
  currentPlayer, 
  players = [],
  currentPlayerIdx = 0,
  teams, 
  isAuctionComplete, 
  sellPlayer, 
  markUnsold, 
  auctionHistory,
  roleEmojis 
}) => {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [bidPrice, setBidPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (currentPlayer) {
      setBidPrice(currentPlayer.BaseTokens);
      setSelectedTeam(Object.keys(teams)[0] || '');
    }
  }, [currentPlayer, teams]);

  const handleSellPlayer = async () => {
    if (!selectedTeam || !currentPlayer) return;
    
    setLoading(true);
    try {
      await sellPlayer(selectedTeam, bidPrice);
    } catch (error) {
      alert('Failed to sell player: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUnsold = async () => {
    setLoading(true);
    try {
      await markUnsold();
    } catch (error) {
      alert('Failed to mark player unsold: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Display-only helpers for the affordability/squad-space badges below.
  // They no longer gate the bid itself — see isValidBid.
  const canAfford = (team, price) => team.tokensLeft >= price;
  const isSquadFull = (team) => team.squad.length >= team.maxSquadSize;

  // CPL 2026: the only hard rules are the per-player category cap, the team's
  // remaining purse and squad size. Category spend caps are advisory.
  const isValidBid = (team, playerRole, price) =>
    validateBid(team, playerRole, price).valid;

  const bidRejection = currentPlayer && teams[selectedTeam]
    ? validateBid(teams[selectedTeam], currentPlayer.Role, bidPrice).reason
    : null;

  const currentMaxBid = currentPlayer ? maxBidFor(currentPlayer.Role) : 0;

  const keeperWarningTeams = Object.entries(teams)
    .filter(([, team]) => needsWicketKeeper(team))
    .map(([name]) => name);

  const downloadResults = () => {
    const csv = [
      ['Player', 'Role', 'Base Tokens', 'Sold Price', 'Team', 'Tokens Left', 'Squad Size'],
      ...auctionHistory.map(h => [h.Player, h.Role, h.BaseTokens, h.SoldPrice, h.Team, h.TokensLeft, h.SquadSize])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auction_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isAuctionComplete) {
    return (
      <div className="text-center py-12">
        <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">🎊 Auction Complete!</h2>
        <p className="text-gray-600 mb-6">All players have been processed</p>
        
        <button
          onClick={downloadResults}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={20} />
          Download Final Results
        </button>

        {/* Final Squad Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(teams).map(([teamName, teamData]) => (
            <div key={teamName} className="bg-white/70 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">{teamName}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {teamData.squad.length} players | 🪙 {teamData.tokensLeft} tokens left
              </p>
              {teamData.squad.length > 0 ? (
                <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {teamData.squad.map((player, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{player.Name}</span>
                      <span>🪙 {player.BidPrice}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No players purchased</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <div className="text-center py-12">
        <Target size={64} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-600">No Current Player</h2>
        <p className="text-gray-500">Waiting for auction to begin...</p>
      </div>
    );
  }

  const selectedTeamData = teams[selectedTeam];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Target size={24} />
        Live Auction - Category-Based Bidding
      </h2>

        {currentPlayer && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <strong>Max bid for {currentPlayer.Role}:</strong> 🪙 {currentMaxBid}
            </span>
            {bidRejection && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {bidRejection}
              </span>
            )}
          </div>
        )}

        {keeperWarningTeams.length > 0 && (
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            🧤 Needs a wicket keeper before the squad fills: {keeperWarningTeams.join(', ')}
          </div>
        )}

      {/* Category Progress Section */}
      <div className="mb-8">
        <CategoryProgress 
          players={players}
          currentPlayerIdx={currentPlayerIdx}
          teams={teams}
          auctionHistory={auctionHistory}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Player Card */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">🎯 Current Player</h3>
          
          <div className="player-card rounded-xl p-6 text-white shadow-lg">
            <div className="text-center mb-4">
              <img
                src={currentPlayer.PhotoFileName ? `/players/${currentPlayer.PhotoFileName}` : '/placeholder-player.svg'}
                alt={currentPlayer.Name}
                className="w-40 h-56 mx-auto mb-4 rounded-lg object-cover border-4 border-white/30 bg-white/20 shadow-lg"
                onError={(e) => {
                  e.target.src = '/placeholder-player.svg';
                }}
              />
              
              <h2 className="text-3xl font-bold mb-2">{currentPlayer.Name}</h2>
              <p className="text-xl mb-2">
                {roleEmojis[currentPlayer.Role]} {currentPlayer.Role}
              </p>
              <p className="text-2xl font-bold">
                Base: {currentPlayer.BaseTokens} 🪙
              </p>
              <p className="text-sm opacity-90 mt-2">
                Player ID: {currentPlayer.PlayerID}
              </p>
            </div>
          </div>
        </div>

        {/* Timer and Bidding Panel */}
        <div className="space-y-6">
          {/* Auction Timer */}
          <AuctionTimer
            duration={60}
            onTimeUp={() => {
              // Auto mark as unsold when timer expires
              handleMarkUnsold();
            }}
          />
          
          <h3 className="text-xl font-semibold text-gray-800 mb-4">💰 Place Bid</h3>
          
          <div className="bg-white/70 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Winning Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
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
                Final Bid Price (Tokens)
              </label>
              <input
                type="number"
                min={currentPlayer.BaseTokens}
                step="5"
                value={bidPrice}
                onChange={(e) => setBidPrice(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              
              {/* Quick Bid Buttons */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Bid Increments
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 50].map(increment => (
                    <button
                      key={increment}
                      onClick={() => setBidPrice(prev => prev + increment)}
                      className="px-3 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-sm font-medium"
                    >
                      +{increment}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Affordability Check */}
            {selectedTeamData && currentPlayer && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg text-center ${
                    canAfford(selectedTeamData, bidPrice) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className="text-sm font-medium">
                      {canAfford(selectedTeamData, bidPrice) ? '✅ Can Afford' : '❌ Insufficient Tokens'}
                    </div>
                    <div className="text-xs">
                      {selectedTeamData.tokensLeft} tokens available
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg text-center ${
                    !isSquadFull(selectedTeamData) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className="text-sm font-medium">
                      {!isSquadFull(selectedTeamData) ? '✅ Squad Space' : '❌ Squad Full'}
                    </div>
                    <div className="text-xs">
                      {selectedTeamData.squad.length}/{selectedTeamData.maxSquadSize} players
                    </div>
                  </div>
                </div>
                
                {/* Category Budget Check */}
                {selectedTeamData.categoryBudgets && selectedTeamData.categoryBudgets[currentPlayer.Role] && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-800 mb-2">
                      {roleEmojis[currentPlayer.Role]} {currentPlayer.Role} Budget
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium">Remaining</div>
                        <div className={`${selectedTeamData.categoryBudgets[currentPlayer.Role].remaining >= bidPrice ? 'text-green-600' : 'text-red-600'}`}>
                          🪙 {selectedTeamData.categoryBudgets[currentPlayer.Role].remaining}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Players</div>
                        <div className={`${selectedTeamData.roleCount[currentPlayer.Role] < selectedTeamData.categoryBudgets[currentPlayer.Role].maxPlayers ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedTeamData.roleCount[currentPlayer.Role]}/{selectedTeamData.categoryBudgets[currentPlayer.Role].maxPlayers}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Min Req</div>
                        <div className={`${selectedTeamData.roleCount[currentPlayer.Role] >= selectedTeamData.categoryBudgets[currentPlayer.Role].minPlayers ? 'text-green-600' : 'text-orange-600'}`}>
                          {selectedTeamData.categoryBudgets[currentPlayer.Role].minPlayers}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={handleSellPlayer}
                disabled={loading || !selectedTeamData || !currentPlayer || !isValidBid(selectedTeamData, currentPlayer.Role, bidPrice)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle size={20} />
                {loading ? 'Processing...' : 'Confirm Sale'}
              </button>
              
              <button
                onClick={handleMarkUnsold}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward size={20} />
                Mark Unsold
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAuction;