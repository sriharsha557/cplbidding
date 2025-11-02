import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { supabaseAuctionService } from '../services/supabaseService';
import toast from 'react-hot-toast';

const DataCleanup = ({ onDataCleared }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);

  const handleResetAuction = async () => {
    setLoading(true);
    const resetToast = toast.loading('Resetting auction data...');

    try {
      const result = await supabaseAuctionService.resetAuctionData();
      
      if (result.success) {
        toast.success('✅ Auction data reset successfully!', { id: resetToast });
        if (onDataCleared) onDataCleared();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(`Failed to reset auction: ${error.message}`, { id: resetToast });
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    const clearToast = toast.loading('Clearing all data...');

    try {
      const result = await supabaseAuctionService.clearAllData();
      
      if (result.success) {
        toast.success('✅ All data cleared successfully!', { id: clearToast });
        if (onDataCleared) onDataCleared();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(`Failed to clear data: ${error.message}`, { id: clearToast });
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={20} className="text-red-600" />
        <h3 className="font-semibold text-red-800">Data Management</h3>
      </div>
      
      <p className="text-sm text-red-700 mb-4">
        Use these options to clean up test data or reset the auction state.
      </p>

      <div className="space-y-3">
        {/* Reset Auction Data */}
        <div className="flex items-center justify-between p-3 bg-white rounded border">
          <div>
            <h4 className="font-medium text-gray-800">Reset Auction</h4>
            <p className="text-sm text-gray-600">
              Reset all auction progress (keeps players & teams, clears sales)
            </p>
          </div>
          
          {showConfirm === 'reset' ? (
            <div className="flex gap-2">
              <button
                onClick={handleResetAuction}
                disabled={loading}
                className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                disabled={loading}
                className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm('reset')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              <RotateCcw size={16} />
              Reset Auction
            </button>
          )}
        </div>

        {/* Clear All Data */}
        <div className="flex items-center justify-between p-3 bg-white rounded border">
          <div>
            <h4 className="font-medium text-gray-800">Clear All Data</h4>
            <p className="text-sm text-gray-600">
              Delete all players, teams, and auction history (complete cleanup)
            </p>
          </div>
          
          {showConfirm === 'clear' ? (
            <div className="flex gap-2">
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                disabled={loading}
                className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm('clear')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
        <strong>⚠️ Warning:</strong> These actions cannot be undone. Make sure you have backups if needed.
      </div>
    </div>
  );
};

export default DataCleanup;