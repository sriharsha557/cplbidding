/**
 * CPL 2026 rules — single source of truth.
 *
 * The 1,000-coin budget applies ONLY to players acquired through the auction.
 * The five pre-auction players (Captain, Vice-Captain, 3 Retained/Traded) cost
 * zero coins, so every team enters the auction with the full 1,000 and five
 * players already on the books. Bidding begins at each team's sixth player.
 */
export const CPL_2026 = {
  auctionBudget: 1000,

  maxBidByCategory: {
    Batsman: 250,
    Bowler: 250,
    'All-rounder': 350,
    WicketKeeper: 150
  },

  minWicketKeepers: 1,

  preAuctionSlots: {
    captain: 1,
    viceCaptain: 1,
    retainedOrTraded: 3,
    total: 5
  },

  defaultSquadSize: 15,

  submissionDeadline: '2026-08-17',

  tournament: { start: '2026-09-12', end: '2026-10-04' },

  // Display-only guidance. NOT enforced — superseded by maxBidByCategory.
  advisoryCategorySpend: {
    Batsman: 420,
    Bowler: 420,
    'All-rounder': 240,
    WicketKeeper: 120
  }
};

export default CPL_2026;
