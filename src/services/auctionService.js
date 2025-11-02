const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

class AuctionService {
  async loadData() {
    try {
      const response = await fetch(`${API_BASE}/load-data`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error loading auction data:', error);
      throw error;
    }
  }

  async sellPlayer(playerId, teamName, bidPrice, playerRole) {
    try {
      const response = await fetch(`${API_BASE}/sell-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          teamName,
          bidPrice,
          playerRole
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sell player');
      }

      return await response.json();
    } catch (error) {
      console.error('Error selling player:', error);
      throw error;
    }
  }

  async markUnsold(playerId) {
    try {
      const response = await fetch(`${API_BASE}/mark-unsold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark player unsold');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking player unsold:', error);
      throw error;
    }
  }

  async getAuctionHistory() {
    try {
      const response = await fetch(`${API_BASE}/auction-history`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting auction history:', error);
      throw error;
    }
  }
}

export const auctionService = new AuctionService();