# League phase — squads, pools, schedule

Once the auction is done the public page (`src/components/HomePage.js`) becomes a
league hub: final squads, the two pools, and the match schedule. It is driven by
three config files and one flag — no live Supabase dependency.

## The switch

`src/config/teams2026.js`:

```js
export const SEASON_PHASE = 'league'; // 'preauction' | 'auction' | 'league'
```

- `preauction` — team line-up, road-to-auction, auction format
- `auction` — live bidding board (also auto-engages once players sell)
- `league` — this hub

Flip it by hand. The public page renders the same thing whether or not the
database is reachable.

## 1. Squads — generated, do not hand-edit

`src/config/squads2026.js` is built from one source of truth:

```
data/auction_log_2026.csv      player_id,team_name,sold_price   (the 67 buys)
```

plus `data/CPL_2026_PreAuction_Template.xlsx` (retained 40) and
`data/CPL_2026_AuctionPlayers.xlsx` (pool) for names/roles/photos.

```
node scripts/export_squads_config.js
```

This also regenerates `sql/2026_apply_auction_log.sql` from the same CSV, so the
site and the database load can never disagree. The script prints a warning (not
an error) for any team that is short of 14 or over the 1000 budget — fix the CSV
row and re-run. Four squads end at 13: 68 players placed (67 pool + Chandra
Sekhar 4YVM) across 72 auction slots leaves four unfilled.

`4YVM` "Chandra Sekhar" and `2X2H` "Chandra Sekhar Gubbala" are two different
people with the same first name. `2X2H` is Fearless Falcons' Vice-Captain;
`4YVM` went unsold and was attached to Pirates at base price. `4YVM` was held out
of the auction insert on the name clash, so he is carried as a `MANUAL_PLAYERS`
entry in `export_squads_config.js`, which also makes the apply SQL `INSERT` his
row before the sale update.

To correct a sale: edit the line in `data/auction_log_2026.csv`, re-run the
script, then run `sql/2026_verify_auction_log.sql` / `sql/2026_apply_auction_log.sql`
against Supabase.

## 2. Pools — `src/config/pools2026.js`

```js
export const POOLS_2026 = {
  'Pool A': ['CPL_T04', 'CPL_T07', 'CPL_T05', 'CPL_T03'], // Mavericks, CSK, Quality Strikers, Hits & Misses
  'Pool B': ['CPL_T06', 'CPL_T08', 'CPL_T01', 'CPL_T02']  // Pirates, Digi Titans, Avengers, Fearless Falcons
};
```

Order within a pool is the fixture seeding (1v2 / 3v4, 1v3 / 2v4, 1v4 / 2v3).
Every team must appear exactly once (enforced by `pools2026.test.js`).

## 3. Schedule — `src/config/schedule2026.js`

League fixtures are the full round-robin derived from the pool seeding above.
Dates, times and overs come from the published grid (league 15 overs, knockouts
20; Sept 12/19/26, Oct 3–4). Semis are Pool A winner v Pool B runner-up and Pool
B winner v Pool A runner-up; those rows stay `teamA/teamB: null` with a `note`
until the table decides them. `LEAGUE_VENUE` is still blank — set it once the
ground is named. Knockouts are at Centurion.

`SCHEDULE_BY_DATE` is the render-ready grouping (one block per Saturday, a
mini-table per pool), mirroring the grid image.

## Components

`src/components/season/` — `Pools`, `Schedule`, `TeamSquads` (expandable), and
`LeaguePhaseShowcase` which stacks all three. Styling: the `cpl-pool*`,
`cpl-schedule*`, `cpl-squad*` blocks in `src/index.css`.
