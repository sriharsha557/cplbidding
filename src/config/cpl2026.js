/**
 * CPL 2026 rules — single source of truth.
 *
 * The 1,000-coin budget applies ONLY to players acquired through the auction.
 * The five pre-auction players (Captain, Vice-Captain, 3 Retained/Traded) cost
 * zero coins, so every team enters the auction with the full 1,000 and five
 * players already on the books. Bidding begins at each team's sixth player.
 *
 * There are no per-category budgets: a team may spend its purse however it
 * likes. The one bidding limit is a flat cap — no single player may go for more
 * than maxBidPerPlayer coins, whatever their role.
 */
export const CPL_2026 = {
  auctionBudget: 1000,

  maxBidPerPlayer: 350,

  minWicketKeepers: 1,

  preAuctionSlots: {
    captain: 1,
    viceCaptain: 1,
    retainedOrTraded: 3,
    total: 5
  },

  defaultSquadSize: 14,

  submissionDeadline: '2026-08-17',

  tournament: { start: '2026-09-12', end: '2026-10-04' },

};

export default CPL_2026;
