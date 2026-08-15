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
  const locked = new Set(lockedPlayerIds);
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
