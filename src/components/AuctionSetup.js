import React from 'react';
import { Settings, Play, Database, Users, Coins } from 'lucide-react';
import ExcelUpload from './ExcelUpload';

const AuctionSetup = ({ 
  auctionState, 
  setAuctionState, 
  loadAuctionData, 
  startAuction, 
  loading 
}) => {
  const hasData = auctionState.players.length > 0 && Object.keys(auctionState.teams).length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="auction-container rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome to the Digital Bidding System
          </h2>
          <p className="text-gray-600 text-lg">
            Configure your auction settings and load team data to begin
          </p>
        </div>

        <div className="space-y-8">
          {/* Configuration Panel */}
          <div className="bg-white/50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="text-teal-600" size={24} />
              <h3 className="text-xl font-semibold text-gray-800">Auction Configuration</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Coins size={16} className="inline mr-1" />
                  Max Tokens per Team
                </label>
                <input
                  type="number"
                  min="500"
                  max="5000"
                  step="100"
                  value={auctionState.maxTokens}
                  onChange={(e) => setAuctionState(prev => ({
                    ...prev,
                    maxTokens: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users size={16} className="inline mr-1" />
                  Max Squad Size
                </label>
                <input
                  type="number"
                  min="10"
                  max="25"
                  value={auctionState.maxSquadSize}
                  onChange={(e) => setAuctionState(prev => ({
                    ...prev,
                    maxSquadSize: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Excel Upload Panel */}
          <div className="bg-white/50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="text-blue-600" size={24} />
              <h3 className="text-xl font-semibold text-gray-800">Upload Excel Data</h3>
            </div>
            
            <ExcelUpload onDataLoaded={loadAuctionData} />
          </div>

          {/* Data Loading Panel */}
          <div className="bg-white/50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="text-emerald-600" size={24} />
              <h3 className="text-xl font-semibold text-gray-800">Load Auction Data</h3>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={loadAuctionData}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Database size={20} />
                {loading ? 'Loading...' : 'Load from Database'}
              </button>

              {hasData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Data Loaded Successfully</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>Players: {auctionState.players.length}</p>
                    <p>Teams: {Object.keys(auctionState.teams).length}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Setup Instructions</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-blue-700">
            <div>
              <h4 className="font-semibold mb-2">Features:</h4>
              <ul className="space-y-1">
                <li>🪙 Token-based bidding system</li>
                <li>🖼️ Team logos and player photos</li>
                <li>📊 Live team dashboards</li>
                <li>🎯 Role-based squad management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">More Features:</h4>
              <ul className="space-y-1">
                <li>📈 Real-time auction history</li>
                <li>👁️ View and reassign unsold players</li>
                <li>💾 Auto-update Excel files</li>
                <li>📥 Export auction results</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Start Auction Button */}
        <div className="text-center mt-8">
          <button
            onClick={startAuction}
            disabled={!hasData}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-lg font-semibold rounded-lg hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
          >
            <Play size={24} />
            Start Auction
          </button>
          
          {!hasData && (
            <p className="text-gray-500 text-sm mt-2">
              Please load players and teams data first
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionSetup;