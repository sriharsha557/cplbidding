import { CPL_2026 } from '../config/cpl2026';

// Must match the database CHECK constraint exactly.
export const PLAYER_ROLES = ['Batsman', 'Bowler', 'All-rounder', 'WicketKeeper'];
export const PRE_AUCTION_ROLES = ['Captain', 'ViceCaptain', 'Squad'];
export const AVAILABILITY_VALUES = ['Unknown', 'Available', 'Unavailable'];

const REQUIRED_PLAYER_COLUMNS = ['TeamName', 'PlayerID', 'Name', 'Role', 'BaseTokens', 'PreAuctionRole'];

/**
 * Validates a pre-auction workbook before anything is written.
 *
 * Blocking errors stop the upload entirely — a partial write would leave some
 * teams locked and others not. Warnings are reported and ignored.
 *
 * @param {Array<Object>} teamRows   rows from the Teams sheet
 * @param {Array<Object>} playerRows rows from the PreAuction sheet
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
export function validatePreAuctionUpload(teamRows, playerRows) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(teamRows) || teamRows.length === 0) {
    errors.push('Teams sheet is empty.');
  }
  if (!Array.isArray(playerRows) || playerRows.length === 0) {
    errors.push('PreAuction sheet is empty.');
  }
  if (errors.length > 0) return { valid: false, errors, warnings };

  const teamNames = teamRows.map(t => t.TeamName).filter(Boolean);
  teamRows.forEach((team, i) => {
    if (!team.TeamID) errors.push(`Teams row ${i + 2}: missing TeamID.`);
    if (!team.TeamName) errors.push(`Teams row ${i + 2}: missing TeamName.`);
  });

  // Row-level checks. Row numbers are 1-based plus a header row, so +2.
  const seenIds = new Map();
  playerRows.forEach((row, i) => {
    const line = `PreAuction row ${i + 2}`;

    REQUIRED_PLAYER_COLUMNS.forEach(col => {
      const value = row[col];
      if (value === undefined || value === null || value === '') {
        errors.push(`${line}: missing ${col}.`);
      }
    });

    if (row.TeamName && !teamNames.includes(row.TeamName)) {
      errors.push(`${line}: unknown team "${row.TeamName}".`);
    }
    if (row.Role && !PLAYER_ROLES.includes(row.Role)) {
      errors.push(`${line}: invalid Role "${row.Role}". Use one of ${PLAYER_ROLES.join(', ')}.`);
    }
    if (row.PreAuctionRole && !PRE_AUCTION_ROLES.includes(row.PreAuctionRole)) {
      errors.push(`${line}: invalid PreAuctionRole "${row.PreAuctionRole}". Use one of ${PRE_AUCTION_ROLES.join(', ')}.`);
    }
    if (row.BaseTokens !== undefined && row.BaseTokens !== '' && Number.isNaN(Number(row.BaseTokens))) {
      errors.push(`${line}: BaseTokens "${row.BaseTokens}" is not a number.`);
    }
    if (row.Availability && !AVAILABILITY_VALUES.includes(row.Availability)) {
      errors.push(`${line}: invalid Availability "${row.Availability}". Use one of ${AVAILABILITY_VALUES.join(', ')}.`);
    }

    if (row.PlayerID) {
      if (seenIds.has(row.PlayerID)) {
        errors.push(`${line}: duplicate PlayerID "${row.PlayerID}" (first seen on row ${seenIds.get(row.PlayerID)}).`);
      } else {
        seenIds.set(row.PlayerID, i + 2);
      }
    }

    if (row.Availability && row.Availability !== 'Available') {
      warnings.push(`${row.Name || row.PlayerID} (${row.TeamName}) is marked ${row.Availability}.`);
    }
  });

  // Per-team slot counts.
  const { captain, viceCaptain, retainedOrTraded, total } = CPL_2026.preAuctionSlots;
  teamNames.forEach(teamName => {
    const squad = playerRows.filter(r => r.TeamName === teamName);
    const count = role => squad.filter(r => r.PreAuctionRole === role).length;

    if (squad.length !== total) {
      errors.push(`${teamName}: has ${squad.length} players, needs exactly ${total}.`);
    }
    if (count('Captain') !== captain) {
      errors.push(`${teamName}: has ${count('Captain')} Captain rows, needs exactly ${captain}.`);
    }
    if (count('ViceCaptain') !== viceCaptain) {
      errors.push(`${teamName}: has ${count('ViceCaptain')} ViceCaptain rows, needs exactly ${viceCaptain}.`);
    }
    if (count('Squad') !== retainedOrTraded) {
      errors.push(`${teamName}: has ${count('Squad')} Squad rows, needs exactly ${retainedOrTraded}.`);
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Maps validated sheet rows to database column names.
 * Only call this after validatePreAuctionUpload returns valid.
 */
export function normalizePreAuctionRows(playerRows) {
  return playerRows.map(row => ({
    player_id: String(row.PlayerID),
    name: row.Name,
    role: row.Role,
    base_tokens: Number(row.BaseTokens),
    photo_filename: row.PhotoFileName || null,
    department: row.Department || null,
    availability: row.Availability || 'Unknown',
    pre_auction_role: row.PreAuctionRole,
    sold_to: row.TeamName,
    sold_price: 0,
    status: 'PreAuction',
    is_captain: row.PreAuctionRole === 'Captain',
    is_vice_captain: row.PreAuctionRole === 'ViceCaptain'
  }));
}
