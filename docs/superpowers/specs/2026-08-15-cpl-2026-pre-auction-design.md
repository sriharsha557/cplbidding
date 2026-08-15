# CPL 2026 — Pre-Auction Flow and Auction Rules

**Date:** 2026-08-15
**Status:** Approved for planning

## Purpose

Bring the CPL bidding app in line with the published CPL 2026 rules, and add the pre-auction
workflow that produces each team's first five players before the auction begins.

Two deliverables:

1. **Rules alignment** — 1,000-coin auction budget, per-player maximum bid by category,
   minimum one wicket keeper, configurable squad size.
2. **Pre-auction flow** — admin-entered Captain, Vice-Captain and three retained/traded
   players per team, with availability tracking, validation and a per-team submission lock.

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
| Who operates the flow | Admin-only entry, behind the existing admin password. POCs submit their five over chat/email as they do now. |
| Pre-auction player cost | Zero. Full 1,000 remains. |
| Category spend caps | Retained as **advisory display only**. Not enforced. Replaced as hard rules by per-player max bid + minimum 1 wicket keeper. |
| Squad size | Configurable. Config default of 15, editable per team via the existing `teams.max_squad_size`. |
| 2025 roster source | Fresh Excel upload of last season's squads. |
| Availability | Tracked per player. Warns at submit time; **does not block**. |
| Validation enforcement | Client-side pure functions for messaging, backed by database CHECK constraints and partial unique indexes. |
| Retained vs Traded | **Derived**, not stored: `prev_team !== sold_to` means traded. |

## Architecture

The approach extends the existing `players` and `teams` tables with flags rather than
introducing new tables. This fits the current architecture — the React app reads `players`
and `teams` directly from Supabase — and avoids rewriting the roughly twenty places that
build a squad from `players.sold_to`.

The known cost: reopening a submitted team means clearing flags rather than deleting rows,
and the audit trail is limited to a single timestamp per team. Both are accepted.

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
  advisoryCategorySpend: { Batsman: 420, Bowler: 420, 'All-rounder': 240, WicketKeeper: 120 }
};
```

This resolves an existing contradiction: the budget is currently `1200` in `src/App.js:24`,
`src/utils/auctionUtils.js:52` and throughout `src/services/supabaseService.js`, but `1000`
in both schema files and in `resetAuction`. Every one of those literals is replaced by an
import from this module.

### Schema changes

One migration file, `sql/2026_pre_auction_migration.sql`, targeting the live schema shape —
`supabase/schema.sql`, which is the one matching what `supabaseService` actually queries.

**`players`** gains:

| Column | Type | Purpose |
| --- | --- | --- |
| `availability` | text, default `Unknown` | `Unknown` \| `Available` \| `Unavailable` |
| `pre_auction_role` | text, nullable | `Captain` \| `ViceCaptain` \| `Squad` \| NULL |
| `prev_team` | text, nullable | The player's 2025 team. Set by the roster upload. Source of truth for last season. |

`is_captain` and `is_vice_captain` already exist in the live database and are kept as mirrors
of `pre_auction_role`, since existing code reads them. The migration does not add them.

`status` widens to accept `PreAuction`, so the five locked players sit visibly outside the
auction pool without masquerading as `Sold`.

**`teams`** gains:

| Column | Type | Purpose |
| --- | --- | --- |
| `pre_auction_submitted` | boolean, default false | Submission lock |
| `pre_auction_submitted_at` | timestamptz, nullable | Set on submit, cleared on reopen |

**Deliberately not stored:**

- **`pre_auction_team`** — `players.sold_to` already holds the 2026 team. A second column for
  the same fact can silently diverge.
- **`pre_auction_status`** (`Retained`/`Traded`) — derivable from `prev_team !== sold_to`.
  Storing it invites drift from `prev_team`.

Slot and provenance are orthogonal axes: a traded-in player can be made Captain. `pre_auction_role`
stores the slot; provenance is computed.

| Player | prev_team | sold_to | Derived |
| --- | --- | --- | --- |
| Rahul | Team A | Team A | Retained |
| Vijay | Team A | Team B | Traded |

### Constraints

```sql
CHECK (availability IN ('Unknown', 'Available', 'Unavailable'))
CHECK (pre_auction_role IN ('Captain', 'ViceCaptain', 'Squad'))

CREATE UNIQUE INDEX one_captain_per_team ON players(sold_to) WHERE pre_auction_role = 'Captain';
CREATE UNIQUE INDEX one_vc_per_team      ON players(sold_to) WHERE pre_auction_role = 'ViceCaptain';
```

Because `players.player_id` is already `UNIQUE`, a player has exactly one row and therefore
cannot be claimed by two teams. No constraint is required for that case.

At-*least*-one Captain, at-least-one Vice-Captain, and the three-slot cap cannot be expressed
as unique indexes. They are enforced client-side at submit. A trigger for the three-slot cap
was considered and rejected as disproportionate for an admin-only flow.

### Live database state — verified 2026-08-15

Inspected directly against `https://wtfpchtyungncrwzreft.supabase.co` using the anon key in
`.env.local`. Findings supersede both checked-in schema files, which are stale.

**The database is empty.**

| Table | Rows |
| --- | --- |
| `teams` | 0 |
| `players` | 0 |
| `auction_history` | 0 |
| `auction_state` | 1 (reset state, last updated 2026-08-09) |

**Columns confirmed present** on `players`: `player_id`, `name`, `role`, `base_tokens`,
`photo_filename`, `department`, `status`, `sold_to`, `sold_price`, `auction_order`,
**`is_captain`**, **`is_vice_captain`**. The last two already exist in the live database even
though neither schema file declares them — the schema files are simply out of date, and the
migration does not need to add them.

**Columns confirmed absent**, and therefore required by the migration: `players.availability`,
`players.prev_team`, `players.pre_auction_role`, `teams.pre_auction_submitted`,
`teams.pre_auction_submitted_at`.

**There is no foreign key between `players` and `teams`.** PostgREST reports no relationship
in the schema cache; `sql/fix_foreign_key.sql` dropped `players_sold_to_fkey` precisely so
`sold_to` could hold a team name. `sold_to` is an unconstrained text column. The migration
risk previously flagged around `sold_to` is resolved — there is no constraint to conflict
with, and no data to migrate.

Because every table is empty, the migration is low-risk and the post-migration check is a
smoke test of the app against freshly loaded data rather than a regression check of live
auction records.

## Components

### 2025 roster upload

**Blocked on input data — see "Open blocker" below.** The design assumed the upload would
match existing player rows and set `prev_team`. With `players` empty, there is nothing to
match, so the upload must **upsert on `player_id`**: insert the row when absent, set
`prev_team` when present. This works whether the table is empty or populated, and is safely
re-runnable.

`src/components/ExcelUpload.js` gains a second, separate mode: **Upload 2025 rosters**,
reading `PlayerID | Name | Role | BaseTokens | Team`. `Role` and `BaseTokens` are required
because the upload may be creating the player row outright. It writes no auction columns
(`status`, `sold_price`, `pre_auction_role`), so it cannot disturb auction state. The existing
upload path is unchanged.

## Open blocker — 2025 roster data does not exist

Retention and trade both presuppose knowing each team's 2025 squad. That mapping is not
available anywhere:

- The `players` table is empty, so `sold_to` holds no 2025 results.
- No spreadsheet in `assets/` or `data/` contains a player-to-team mapping. Searched every
  sheet for team/sold/squad/retain columns; the only matches are `TeamID`/`TeamName` in the
  8-row `Teams` sheets, which list teams but not their members.
- `data/captain_team_assignments.xlsx` gives Captain and Vice-Captain per team for 8 teams —
  leadership only, not full squads.
- `assets/CPL_Auction_Data_2025.xlsx` holds 117 players with `IsCaptain`, but no team column.

The pre-auction flow cannot be populated until someone supplies which players were on which
team in 2025. Everything else in this spec can be built and tested without it.

### Pre-auction admin tab

A new **Pre-Auction 2026** tab in `src/components/AdminPage.js`, behind the existing password.

New files:

- `src/utils/preAuctionRules.js` — pure validation functions. No React, no Supabase.
- `src/components/PreAuctionSetup.js` — team selector, roster panel, five slots, validation display.

Within a selected team:

1. **Roster panel** — players where `prev_team` equals the selected team, each with an
   availability control that writes immediately.
2. **Slots 1–2** — Captain and Vice-Captain pickers, searching all players with a `prev_team`,
   own-team entries listed first.
3. **Slots 3–5** — Retained/Traded pickers, same search behaviour.
4. **Validation panel** — live blocking errors and warnings.
5. **Submit**.

### State machine

```
Draft (pre_auction_submitted = false)
   │
   ├── validation passes ──▶ Submitted (pre_auction_submitted = true, submitted_at = NOW())
   │
Submitted
   │
   └── admin reopens ──▶ Draft
```

`Submitted` renders read-only with a Reopen button.

**Submit writes**, per selected player: `status = 'PreAuction'`, `sold_to = <team>`,
`sold_price = 0`, `pre_auction_role`, and `is_captain` / `is_vice_captain` as mirrors of the
role. On the team: `pre_auction_submitted = true`, `pre_auction_submitted_at = NOW()`.
`tokens_left` is untouched and remains 1,000.

**Reopen clears** the team flags *and* resets the five players' pre-auction fields to
`status = 'Available'`, `sold_to = NULL`, `pre_auction_role = NULL`, `is_captain = false`,
`is_vice_captain = false`. Without this, a reopened team leaves orphaned locked players —
the principal edge case this approach exposes.

### Validation rules

Blocking — submit is disabled until all pass:

- Exactly 1 `Captain`, exactly 1 `ViceCaptain`, exactly 3 `Squad`.
- No player occupying two slots within the team.
- Every selection has a non-null `prev_team`. Retention and trade both presuppose a 2025
  team; a player absent from the roster upload cannot fill these slots and goes to the auction.

Warnings — visible, never blocking:

- Any selected player whose `availability` is not `Available`, listed by name.
- For each traded player: `Traded from <prev_team> — confirm both managements agree`. The app
  cannot verify mutual agreement; it records the outcome.

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

### Squad-loading fix

`src/services/supabaseService.js:47` returns every team with `squad: []`, and `src/App.js`
never populates it from `players.sold_to`. Squads only fill in during a live session and are
lost on reload.

This is survivable today. It is not survivable once five players are locked in before auction
day, so `loadData` must build each team's squad from the players table. In scope: the feature
cannot work without it.

## Testing

`react-scripts test` (Jest) is configured; the repo currently has no tests.

- `src/utils/preAuctionRules.test.js` — slot counts, duplicate detection, missing `prev_team`,
  provenance derivation, availability warnings.
- Bid-cap rules — each category boundary, over-budget bids, full-squad rejection.

Both target pure functions where a defect is silent and expensive.

A manual smoke test is run against the live database after migration. Since every table is
empty, this loads fresh data and walks the flow end to end rather than checking existing
records for regressions.

## Sequencing

The 17 August deadline is two days from this document's date.

| Phase | Contents | Needed by |
| --- | --- | --- |
| 1 | Config module, migration, 2025 roster upload, pre-auction tab, submit/reopen, squad-loading fix | **17 Aug 2026** |
| 2 | Bid caps, wicket-keeper banner, advisory category panels | Before the auction (post-18 Aug registration) |

Phase 2 has weeks of runway; Phase 1 does not. Phase 1 is built and verified end to end first.

## Out of scope

- Self-serve access for team POCs. Admin-only entry was chosen; there is no per-team auth.
- A trade approval workflow. Mutual agreement happens between managements outside the app.
- `src/components/HomePageEnhanced.js` and `src/components/PhaseStepper.js` remain orphaned
  scaffolding — not imported by `src/App.js`. Wiring them up is unrelated to this work.
- Replacing the hardcoded client-side admin password in `src/components/AdminPage.js:37`.
- Player registration for the auction, opening 18 August.
