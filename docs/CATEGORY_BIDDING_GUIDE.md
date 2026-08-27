# Auction bidding rules (CPL 2026)

> **Superseded.** CPL 2026 dropped category-based budgets. This file used to
> describe per-role budget pools; that scheme no longer exists in the code.
> The live rules live in [`src/config/cpl2026.js`](../src/config/cpl2026.js) and
> are surfaced to the public on the pre-auction page
> ([`src/components/preauction/AuctionFormat.js`](../src/components/preauction/AuctionFormat.js)).

## The rules

- **One purse.** Every team has **1,000 coins** for the auction. The five
  pre-auction players (captain, vice-captain, three retained/traded) cost
  nothing, so bidding starts at each team's sixth player.
- **No category budgets.** A team spends its purse however it likes — there is
  no cap on how much of it goes to any one role.
- **Flat per-player cap: 350 coins.** No single player can be bought for more
  than 350, whatever their role. This is the only bidding limit and it is
  enforced (`validateBid` in [`src/utils/bidRules.js`](../src/utils/bidRules.js)).
- **Squad size 14.** Nine places to fill at the auction.
- **At least one wicket-keeper per squad** — surfaced as a warning as a team's
  squad fills, not a hard block.

## Auction order

Players are still auctioned by role, wicket-keepers first, then batsmen,
bowlers, all-rounders (`ROLE_ORDER` in
[`src/utils/auctionUtils.js`](../src/utils/auctionUtils.js)). Within a role they
run in `BaseTokens` order, highest first. This is running order only — it carries
no budget meaning.

## Database

The `teams` table still has `*_budget_spent` / `*_budget_remaining` / `*_count`
columns from the old scheme. They have no triggers and nothing writes or reads
them any more; they are harmless dead columns left in place. A future migration
can drop them.
