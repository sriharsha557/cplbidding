import React, { useState } from 'react';
import { History, Download, Search, Filter } from 'lucide-react';

const AuctionHistory = ({ auctionHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  // Debug logging
  console.log('AuctionHistory rendered:', { 
    historyCount: auctionHistory?.length || 0
  });

  const downloadHistory = () => {
    const csv = [
      ['Player', 'Role', 'Base Tokens', 'Sold Price', 'Team', 'Tokens Left', 'Squad Size'],
      ...auctionHistory.map(h => [h.Player, h.Role, h.BaseTokens, h.SoldPrice, h.Team, h.TokensLeft, h.SquadSize])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auction_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get unique teams and roles for filters
  const uniqueTeams = [...new Set(auctionHistory.map(h => h.Team))];
  const uniqueRoles = [...new Set(auctionHistory.map(h => h.Role))];

  // Filter history based on search and filters
  const filteredHistory = auctionHistory.filter(entry => {
    const matchesSearch = entry.Player.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = !filterTeam || entry.Team === filterTeam;
    const matchesRole = !filterRole || entry.Role === filterRole;
    return matchesSearch && matchesTeam && matchesRole;
  });

  // Calculate statistics
  const totalSpent = auctionHistory.reduce((sum, entry) => sum + entry.SoldPrice, 0);
  const avgPrice = auctionHistory.length > 0 ? (totalSpent / auctionHistory.length).toFixed(0) : 0;
  const highestSale = auctionHistory.length > 0 ? Math.max(...auctionHistory.map(h => h.SoldPrice)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <History size={24} />
          Auction History ({auctionHistory.length} sales)
        </h2>
        
        {auctionHistory.length > 0 && (
          <button
            onClick={downloadHistory}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            Download Results
          </button>
        )}
      </div>

      {auctionHistory.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-lg">
          <History size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Auction History</h3>
          <p className="text-gray-500">Start selling players to see auction history here</p>
        </div>
      ) : (
        <div>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-800">🪙 {totalSpent.toLocaleString()}</div>
              <div className="text-sm text-blue-600">Total Tokens Spent</div>
            </div>
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-800">🪙 {avgPrice}</div>
              <div className="text-sm text-green-600">Average Sale Price</div>
            </div>
            <div className="bg-purple-100 border border-purple-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-800">🪙 {highestSale.toLocaleString()}</div>
              <div className="text-sm text-purple-600">Highest Sale</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/70 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">All Teams</option>
                {uniqueTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
            {(searchTerm || filterTeam || filterRole) && (
              <div className="mt-2 text-sm text-gray-600">
                Showing {filteredHistory.length} of {auctionHistory.length} sales
              </div>
            )}
          </div>

          {/* History Table */}
          <div className="bg-white/70 rounded-lg overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit/Loss
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredHistory.map((entry, idx) => {
                    const profitLoss = entry.SoldPrice - entry.BaseTokens;
                    const isProfit = profitLoss > 0;
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{entry.Player}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {entry.Role}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                          🪙 {entry.BaseTokens.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">
                            🪙 {entry.SoldPrice.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {entry.Team}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isProfit 
                              ? 'bg-green-100 text-green-800' 
                              : profitLoss === 0 
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {isProfit ? '+' : ''}{profitLoss} 🪙
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredHistory.length === 0 && (searchTerm || filterTeam || filterRole) && (
            <div className="text-center py-8 text-gray-500">
              No sales match your current filters
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuctionHistory;