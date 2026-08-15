import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Unlock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import ExcelUpload from './ExcelUpload';
import { supabaseAuctionService } from '../services/supabaseService';
import { CPL_2026 } from '../config/cpl2026';

const ROLE_LABEL = {
  Captain: 'C',
  ViceCaptain: 'VC',
  Squad: ''
};

const PreAuctionReview = ({ teams, loadAuctionData }) => {
  const [reopening, setReopening] = useState(null);

  const teamNames = Object.keys(teams);
  const submitted = teamNames.filter(name => teams[name].preAuctionSubmitted);

  const handleReopen = async (teamName) => {
    const confirmed = window.confirm(
      `Reopen ${teamName}?\n\n` +
      `Their ${CPL_2026.preAuctionSlots.total} players return to the auction pool ` +
      `until a new sheet is uploaded.`
    );
    if (!confirmed) return;

    setReopening(teamName);
    try {
      const result = await supabaseAuctionService.reopenTeam(teamName);
      if (!result.success) throw new Error(result.error);
      toast.success(`${teamName} reopened`);
      if (loadAuctionData) await loadAuctionData();
    } catch (error) {
      toast.error(`Failed to reopen ${teamName}: ${error.message}`);
    } finally {
      setReopening(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Pre-Auction Squads</h2>
        <p className="text-gray-600">
          Captain, Vice-Captain and 3 retained/traded players per team. These five cost no coins —
          every team starts the auction with {CPL_2026.auctionBudget} coins.
          Deadline {CPL_2026.submissionDeadline}.
        </p>
      </div>

      <div className={`rounded-lg p-4 border ${
        submitted.length === teamNames.length && teamNames.length > 0
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <p className="font-semibold text-gray-800">
          {submitted.length} of {teamNames.length} teams submitted
        </p>
        {submitted.length < teamNames.length && (
          <p className="text-sm text-gray-700 mt-1">
            Outstanding: {teamNames.filter(n => !teams[n].preAuctionSubmitted).join(', ') || 'none'}
          </p>
        )}
      </div>

      <ExcelUpload mode="preauction" onDataLoaded={loadAuctionData} />

      {teamNames.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          No teams loaded yet. Upload a pre-auction workbook to begin.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamNames.map(teamName => {
            const team = teams[teamName];
            const five = team.squad.filter(p => p.PreAuctionRole);

            return (
              <div key={teamName} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {team.preAuctionSubmitted
                      ? <CheckCircle size={18} className="text-green-600" />
                      : <AlertTriangle size={18} className="text-amber-500" />}
                    <h3 className="font-bold text-gray-800">{teamName}</h3>
                  </div>
                  <span className="text-xs text-gray-500">
                    {five.length}/{CPL_2026.preAuctionSlots.total} · 🪙 {team.tokensLeft}
                  </span>
                </div>

                {five.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Not submitted</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {five.map(player => (
                      <li key={player.PlayerID} className="flex justify-between gap-2">
                        <span className="truncate">
                          {ROLE_LABEL[player.PreAuctionRole] && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-1.5 py-0.5 rounded mr-2">
                              {ROLE_LABEL[player.PreAuctionRole]}
                            </span>
                          )}
                          {player.Name}
                        </span>
                        <span className="text-gray-500 shrink-0">
                          {player.Role}
                          {player.Availability !== 'Available' && (
                            <span className="ml-2 text-amber-600" title={`Availability: ${player.Availability}`}>⚠️</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {team.preAuctionSubmitted && (
                  <button
                    onClick={() => handleReopen(teamName)}
                    disabled={reopening === teamName}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Unlock size={14} />
                    {reopening === teamName ? 'Reopening...' : 'Reopen'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PreAuctionReview;
