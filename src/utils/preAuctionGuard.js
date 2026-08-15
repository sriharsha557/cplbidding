/**
 * Filters a player list down to the auction pool: everyone EXCEPT the five
 * players each team already locked in before the auction (status
 * 'PreAuction'). Those players are zero-cost, already on a team's squad, and
 * must never be put up for bidding — including a team's own Captain being
 * drawn as a lot.
 *
 * Squads are populated from the FULL player list elsewhere (loadData), so
 * this filter is applied only where a list of biddable players is needed —
 * never upstream of squad population.
 *
 * @param {Array<{Status: string}>} players
 * @returns {Array<Object>} players eligible for the auction
 */
export function filterAuctionPool(players) {
  return players.filter(player => player.Status !== 'PreAuction');
}

/**
 * Splits an incoming player upload into rows that are safe to write and rows
 * belonging to players already locked into a team's pre-auction five.
 *
 * The registered-player list is uploaded weeks after the pre-auction squads and
 * will contain many of the same people. Writing those rows would reset their
 * status and sold_to, silently emptying every team.
 *
 * @param {Array<{PlayerID: string}>} incomingPlayers
 * @param {string[]} lockedPlayerIds player_id values whose status is PreAuction
 * @returns {{safeToWrite: Array<Object>, skipped: string[]}}
 */
export function splitOutPreAuctionPlayers(incomingPlayers, lockedPlayerIds) {
  // Coerce BOTH sides: Excel yields numeric IDs, the database yields strings.
  // Matching on only one side fails open, which silently empties every team.
  const locked = new Set(lockedPlayerIds.map(String));
  const safeToWrite = [];
  const skipped = [];

  incomingPlayers.forEach(player => {
    if (locked.has(String(player.PlayerID))) {
      skipped.push(String(player.PlayerID));
    } else {
      safeToWrite.push(player);
    }
  });

  return { safeToWrite, skipped };
}
