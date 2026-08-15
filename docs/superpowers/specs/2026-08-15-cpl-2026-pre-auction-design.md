# CPL 2026 — Pre-Auction Squads and Auction Rules

**Date:** 2026-08-15
**Status:** Approved for planning

## Purpose

Bring the CPL bidding app in line with the published CPL 2026 rules, and let the organiser
load each team's five pre-auction players before the auction begins.

Two deliverables:

1. **Rules alignment** — 1,000-coin auction budget, per-player maximum bid by category,
   minimum one wicket keeper, configurable squad size.
2. **Pre-auction squads** — an Excel upload of the finalised five players per team
   (Captain, Vice-Captain, three retained/traded), with a per-team review and lock.

Retention and trade negotiations happen entirely outside the app between team managements.
The app records the outcome; it does not run the negotiation.

## Published rules this implements

| Rule | Value |
| --- | --- |
| Auction budget per team | 1,000 coins |
| Maximum bid — Wicket Keeper | 150 coins |
| Maximum bid — Batsman | 250 coins |
| Maximum bid — Bowler | 250 coins |
| Maximum bid — All-Rounder | 350 coins |
| Minimum wicket keepers per squad | 1 |
| Pre-auction players per team | 5 (1 Captain + 1 Vice-Captain + 3 Retained/Traded) |
| Submission deadline | 17 August 2026 |
| Tournament window | 12 September – 4 October 2026 |

**The 1,000-coin budget applies only to players acquired through the auction.** The five
pre-auction players cost zero coins; every team enters the auction with the full 1,000 and
five players already on the books. Auction bidding begins at each team's sixth player.

## Decisions taken

| Decision | Choice |
| --- | --- |
| How the five are entered | **Excel upload by the organiser.** No in-app picker. |
| Editing after upload | Review screen only. To change a team, reopen it and re-upload. |
| Retained vs Traded | **Not tracked.** All five are simply pre-auction players. No `prev_team`. |
| Pre-auction player cost | Zero. Full 1,000 remains. |
| Category spend caps | Retained as **advisory display only**. Not enforced. Replaced as hard rules by per-player max bid + minimum 1 wicket keeper. |
| Squad size | Configurable. Config default of 15, editable per team via `teams.max_squad_size`. |
| Availability | Tracked per player. Warns on upload; **does not block**. |
| Validation enforcement | Client-side pure functions for messaging, backed by database CHECK constraints and partial unique indexes. |
| Who operates it | Organiser, behind the existing admin password. |

## Teams

Team names are unchanged from 2025. Eight teams, with the logo filenames that actually exist
in `public/`:

| TeamID | Team name | Logo |
| --- | --- | --- |
| CPL_T01 | Avengers | `Avengers.png` |
| CPL_T02 | Fearless Falcons | `Feralessfalcons.png` |
| CPL_T03 | Hits & Misses | `HitsMisses.png` |
| CPL_T04 | Mavericks | `Mavericks.png` |
| CPL_T05 | Quality Strikers | `quality_strikers.png` |
| CPL_T06 | Pirates | `Pirates.png` |
| CPL_T07 | CSK | `csk.png` |
| CPL_T08 | Digititans | `digititans.png` |

`scripts/update_team_names_and_logos.py` is stale — it writes `Avengers-removebg-preview.png`
and `Quality Strikers.png`, neither of which exists in `public/` (a later commit lowercased
the latter). Use the table above.

## Live database state — verified 2026-08-15

Inspected directly against `https://wtfpchtyungncrwzreft.supabase.co` using the anon key in
`.env.local`. Findings supersede both checked-in schema files, which are stale.

**The database is empty**, deliberately — the organiser cleared it via the app's reset option.

| Table | Rows |
| --- | --- |
| `teams` | 0 |
| `players` | 0 |
| `auction_history` | 0 |
| `auction_state` | 1 (reset state) |

**Columns confirmed present** on `players`: `player_id`, `name`, `role`, `base_tokens`,
`photo_filename`, `department`, `status`, `sold_to`, `sold_price`, `auction_order`,
**`is_captain`**, **`is_vice_captain`**. The last two already exist even though neither schema
file declares them; the migration does not need to add them.

**Columns confirmed absent**, and therefore required by the migration: `players.availability`,
`players.pre_auction_role`, `teams.pre_auction_submitted`, `teams.pre_auction_submitted_at`.

**There is no foreign key between `players` and `teams`.** PostgREST reports no relationship;
`sql/fix_foreign_key.sql` dropped `players_sold_to_fkey` so `sold_to` could hold a team name.
`sold_to` is an unconstrained text column. There is no constraint to conflict with and no data
to migrate, so the migration is low-risk.

## Architecture

Flags on the existing `players` and `teams` tables rather than new tables. This fits the
current architecture — the React app reads `players` and `teams` directly from Supabase — and
avoids rewriting the many places that build a squad from `players.sold_to`.

### Rules configuration

One new module, `src/config/cpl2026.js`, is the single source of truth for every 2026 number:

```js
export const CPL_2026 = {
  // The 1,000-coin budget applies ONLY to players acquired through the auction.
  // The five pre-auction players (Captain, Vice-Captain, 3 Retained/Traded) cost zero coins.
  auctionBudget: 1000,

  maxBidByCategory: {
    Batsman: 250,
    Bowler: 250,
    'All-rounder': 350,
    WicketKeeper: 150
  },

  minWicketKeepers: 1,

  preAuctionSlots: { captain: 1, viceCaptain: 1, retainedOrTraded: 3, total: 5 },

  defaultSquadSize: 15,

  submissionDeadline: '2026-08-17',

  tournament: { start: '2026-09-12', end: '2026-10-04' },

  // Display-only guidance. NOT enforced — superseded by maxBidByCategory.
  advisoryCategorySpend: { Batsman: 420, Bowler: 420, 'All-rounder': 240, WicketKeeper: 120 }
};
```

This resolves an existing contradiction: the budget is currently `1200` in `src/App.js:24`,
`src/utils/auctionUtils.js:52` and throughout `src/services/supabaseService.js`, but `1000`
in both schema files and in `resetAuction`. Every one of those literals is replaced by an
import from this module.

### Schema changes

One migration file, `sql/2026_pre_auction_migration.sql`.

**`players`** gains:

| Column | Type | Purpose |
| --- | --- | --- |
| `availability` | text, default `Unknown` | `Unknown` \| `Available` \| `Unavailable` |
| `pre_auction_role` | text, nullable | `Captain` \| `ViceCaptain` \| `Squad` \| NULL |

`is_captain` and `is_vice_captain` already exist and are kept as mirrors of `pre_auction_role`,
since existing code reads them.

`status` widens to accept `PreAuction`, so the five locked players sit visibly outside the
auction pool without masquerading as `Sold`.

**`teams`** gains `pre_auction_submitted` (boolean, default false) and
`pre_auction_submitted_at` (timestamptz, nullable).

**Deliberately not stored:** `prev_team` and any `Retained`/`Traded` marker. The organiser
does not need the distinction, and neither does any screen.

### Constraints

```sql
CHECK (availability IN ('Unknown', 'Available', 'Unavailable'))
CHECK (pre_auction_role IN ('Captain', 'ViceCaptain', 'Squad'))

CREATE UNIQUE INDEX one_captain_per_team ON players(sold_to) WHERE pre_auction_role = 'Captain';
CREATE UNIQUE INDEX one_vc_per_team      ON players(sold_to) WHERE pre_auction_role = 'ViceCaptain';
```

Because `players.player_id` is already `UNIQUE`, a player has exactly one row and cannot be
claimed by two teams. No constraint is required for that case.

At-*least*-one Captain, at-least-one Vice-Captain, and the three-slot cap cannot be expressed
as unique indexes; they are enforced at upload time.

## Components

### Pre-auction squad upload

A new mode in `src/components/ExcelUpload.js`: **Upload pre-auction squads**. Two sheets.

`Teams` — `TeamID | TeamName | LogoFile`

`PreAuction` — one row per player, 40 rows for 8 teams:

| Column | Required | Notes |
| --- | --- | --- |
| `TeamName` | yes | Must match a row in `Teams` |
| `PlayerID` | yes | Unique across the whole sheet |
| `Name` | yes | |
| `Role` | yes | `Batsman` \| `Bowler` \| `All-rounder` \| `WicketKeeper` |
| `BaseTokens` | yes | |
| `PreAuctionRole` | yes | `Captain` \| `ViceCaptain` \| `Squad` |
| `Availability` | no | Defaults to `Unknown` |
| `PhotoFileName` | no | |
| `Department` | no | |

The upload **upserts on `player_id`**, because `players` is empty and the rows are being
created outright.

**Writes.** Per player: `status = 'PreAuction'`, `sold_to = <team name>`, `sold_price = 0`,
`pre_auction_role`, `availability`, and `is_captain` / `is_vice_captain` mirrored from the
role. Per team: `max_tokens = 1000`, `tokens_left = 1000`, `max_squad_size` from config,
`pre_auction_submitted = true`, `pre_auction_submitted_at = NOW()`.

**Blocking validation** — nothing is written unless the whole sheet passes:

- Every team in `Teams` has exactly 1 `Captain`, exactly 1 `ViceCaptain`, exactly 3 `Squad`.
- No `PlayerID` appears twice.
- Every `TeamName` in `PreAuction` matches a row in `Teams`.
- `Role` and `PreAuctionRole` hold permitted values.

**Warnings** — reported, never blocking: any player whose `Availability` is not `Available`,
listed by name and team.

Errors are reported per team and per row, so a malformed sheet says which team and which line
is wrong rather than failing opaquely.

### Review and reopen

The admin panel gains a **Pre-Auction 2026** tab, behind the existing password, listing all
eight teams with their five players, each player's role and availability, and a submitted
timestamp. Teams that have not been uploaded show as outstanding — the at-a-glance view of
who has missed the 17 August deadline.

**Reopen** clears `pre_auction_submitted` and `pre_auction_submitted_at` on the team, and
resets that team's five players to `status = 'Available'`, `sold_to = NULL`,
`pre_auction_role = NULL`, `is_captain = false`, `is_vice_captain = false`. Any player dropped
from a re-uploaded sheet therefore stays in the database and flows into the auction pool,
which is the correct outcome — they are no longer in anyone's five.

### Guarding pre-auction rows during the later player upload

The full registered-player list is uploaded after registration opens on 18 August, using the
existing upload path. That path currently writes `status: player.Status || 'Available'` and
`sold_to: player.SoldTo || null` for every row — **it would silently wipe every pre-auction
assignment** if a pre-auction player also appears in the registration list, which is likely.

`uploadExcelData` and `mergeExcelData` in `src/services/supabaseService.js` must therefore
skip `status`, `sold_to`, `sold_price`, `pre_auction_role`, `is_captain` and `is_vice_captain`
for any existing row whose `status` is `PreAuction`. Non-auction fields such as photo and
department may still update.

This makes upload order irrelevant, which matters because the two uploads are days apart and
`uploadExcelData` also begins by deleting every row.

### Squad-loading fix

`src/services/supabaseService.js:47` returns every team with `squad: []`, and `src/App.js`
never populates it from `players.sold_to`. Squads only fill in during a live session and are
lost on reload.

That is survivable today. It is not survivable once five players are locked in weeks before
auction day, so `loadData` must build each team's squad from the players table. In scope: the
feature cannot work without it.

## Auction-time enforcement

Hard rules in `src/components/LiveAuction.js` — a bid is rejected when it:

- exceeds `CPL_2026.maxBidByCategory[role]` for the current player's category,
- exceeds the team's remaining tokens, or
- would exceed the team's `max_squad_size`.

The current category's maximum is displayed beside the bid input, visible before a number is
called in the room.

Advisory only: `src/components/CategoryProgress.js` continues to show per-role spend using
`advisoryCategorySpend` as guidance, but no longer blocks. The wicket-keeper minimum surfaces
as a banner when a team's remaining slots reach 1 with no keeper in the squad — a warning, not
a block, because blocking mid-auction cannot be explained in the room.

Players with `status = 'PreAuction'` are excluded from the auction pool and included in team
squads at price 0.

## Testing

`react-scripts test` (Jest) is configured; the repo currently has no tests.

- `src/utils/preAuctionRules.test.js` — slot counts per team, duplicate `PlayerID`, unknown
  team name, invalid role values, availability warnings.
- Bid-cap rules — each category boundary, over-budget bids, full-squad rejection.
- The PreAuction guard — a registration-list upload must not alter a `PreAuction` row.

All three target pure functions where a defect is silent and expensive.

A manual smoke test runs against the live database after migration: upload the squads, confirm
all eight teams show five players at 1,000 coins remaining, reopen one team, re-upload.

## Sequencing

| Phase | Contents | Needed by |
| --- | --- | --- |
| 1 | Config module, migration, pre-auction squad upload, review/reopen tab, squad-loading fix | **17 Aug 2026** |
| 2 | PreAuction guard in the player upload path | Before the 18 Aug registration upload |
| 3 | Bid caps, wicket-keeper banner, advisory category panels | Before the auction |

Phase 1 is built and verified end to end first. Phase 2 must land before the registered-player
list is uploaded, not before the auction.

## Out of scope

- Self-serve access for team POCs. There is no per-team auth.
- Any in-app retention or trade workflow. Negotiation happens between managements off-app.
- Recording where a player came from in 2025.
- `src/components/HomePageEnhanced.js` and `src/components/PhaseStepper.js` remain orphaned
  scaffolding — not imported by `src/App.js`. Wiring them up is unrelated to this work.
- Replacing the hardcoded client-side admin password in `src/components/AdminPage.js:37`.
- Player registration for the auction, opening 18 August.
