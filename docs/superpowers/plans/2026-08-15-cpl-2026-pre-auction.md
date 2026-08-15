# CPL 2026 Pre-Auction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Load each team's five pre-auction players from an Excel upload, and enforce the CPL 2026 auction rules (1,000-coin budget, per-player max bid by category, minimum one wicket keeper).

**Architecture:** A single config module holds every 2026 number. Four new columns on the existing `players` and `teams` tables record the pre-auction five. A new Excel upload mode validates the whole workbook before writing anything, then upserts players as `status = 'PreAuction'` with `sold_to` set, so every existing screen that builds a squad from `sold_to` keeps working. Validation lives in pure functions so it can be unit tested without React or Supabase.

**Tech Stack:** React 18 (Create React App), Supabase (`@supabase/supabase-js`), `xlsx` for Excel parsing, Jest via `react-scripts test`, Tailwind utility classes, `lucide-react` icons, `react-hot-toast` notifications.

**Spec:** `docs/superpowers/specs/2026-08-15-cpl-2026-pre-auction-design.md`

## Global Constraints

- Auction budget per team: **1,000 coins**. The five pre-auction players cost **zero**.
- Maximum bid by category: Wicket Keeper **150**, Batsman **250**, Bowler **250**, All-Rounder **350**.
- Minimum wicket keepers per squad: **1** (warning only, never blocks a bid).
- Pre-auction players per team: **5** = 1 Captain + 1 Vice-Captain + 3 Squad.
- Player role values, exactly: `Batsman`, `Bowler`, `All-rounder`, `WicketKeeper`. Note the lowercase `r` in `All-rounder` and the single word `WicketKeeper` — these match the existing database CHECK constraint and must not be changed.
- Pre-auction role values, exactly: `Captain`, `ViceCaptain`, `Squad`.
- Availability values, exactly: `Unknown`, `Available`, `Unavailable`. Default `Unknown`.
- Submission deadline: **2026-08-17**. Tournament: **2026-09-12** to **2026-10-04**.
- Category spend caps are **advisory display only** — never block a bid.
- Team names are unchanged from 2025 and are fixed at eight (see Task 5 table).
- The live database is **empty** and has **no `players → teams` foreign key**. `sold_to` is an unconstrained text column holding a **team name**, not a team ID.
- `is_captain` and `is_vice_captain` already exist in the live database. Do not add them.
- Never commit `.env.local` or print the Supabase key into a file, log, or commit message.

---

## File Structure

**Created:**
- `src/config/cpl2026.js` — every 2026 rule constant. Single source of truth.
- `src/utils/preAuctionRules.js` — pure validation and row-normalisation for the squad upload.
- `src/utils/preAuctionRules.test.js` — tests for the above.
- `src/utils/bidRules.js` — pure bid validation (max bid, budget, squad size).
- `src/utils/bidRules.test.js` — tests for the above.
- `src/components/PreAuctionReview.js` — per-team review, submitted state, reopen.
- `sql/2026_pre_auction_migration.sql` — the migration.
- `scripts/create_pre_auction_template.js` — generates the blank upload workbook.

**Modified:**
- `src/services/supabaseService.js` — squad population on load, pre-auction upsert, reopen, PreAuction guard.
- `src/components/ExcelUpload.js` — a second upload mode.
- `src/components/AdminPage.js` — pre-auction tab reachable before the auction starts.
- `src/components/LiveAuction.js` — bid caps and the wicket-keeper banner.
- `src/App.js` — budget constant from config.
- `src/utils/auctionUtils.js` — budget constant from config.

---

### Task 1: Rules configuration module

Creates the single source of truth and removes the 1200-vs-1000 contradiction that exists today.

**Files:**
- Create: `src/config/cpl2026.js`
- Create: `src/config/cpl2026.test.js`
- Modify: `src/utils/auctionUtils.js:52`
- Modify: `src/App.js:24`, `src/App.js:179`

**Interfaces:**
- Consumes: nothing.
- Produces: `CPL_2026` object with keys `auctionBudget` (number), `maxBidByCategory` (object keyed by role → number), `minWicketKeepers` (number), `preAuctionSlots` (`{captain, viceCaptain, retainedOrTraded, total}`), `defaultSquadSize` (number), `submissionDeadline` (ISO date string), `tournament` (`{start, end}`), `advisoryCategorySpend` (object keyed by role → number). Also `TOTAL_TEAM_BUDGET` re-exported from `src/utils/auctionUtils.js` for backward compatibility.

- [ ] **Step 1: Write the failing test**

Create `src/config/cpl2026.test.js`:

```js
import { CPL_2026 } from './cpl2026';

test('auction budget is 1000 coins', () => {
  expect(CPL_2026.auctionBudget).toBe(1000);
});

test('max bid per category matches the published rules', () => {
  expect(CPL_2026.maxBidByCategory).toEqual({
    Batsman: 250,
    Bowler: 250,
    'All-rounder': 350,
    WicketKeeper: 150
  });
});

test('pre-auction slots total five', () => {
  const { captain, viceCaptain, retainedOrTraded, total } = CPL_2026.preAuctionSlots;
  expect(captain + viceCaptain + retainedOrTraded).toBe(total);
  expect(total).toBe(5);
});

test('every max bid fits inside the total budget', () => {
  Object.values(CPL_2026.maxBidByCategory).forEach(max => {
    expect(max).toBeLessThan(CPL_2026.auctionBudget);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx react-scripts test --watchAll=false --testPathPattern=cpl2026`
Expected: FAIL — `Cannot find module './cpl2026'`.

- [ ] **Step 3: Create the config module**

Create `src/config/cpl2026.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx react-scripts test --watchAll=false --testPathPattern=cpl2026`
Expected: PASS, 4 tests.

- [ ] **Step 5: Point auctionUtils at the config**

In `src/utils/auctionUtils.js`, add this import at the top of the file (line 1, above the existing `ROLE_ORDER` export):

```js
import { CPL_2026 } from '../config/cpl2026';
```

Then replace line 52:

```js
export const TOTAL_TEAM_BUDGET = 1200;
```

with:

```js
export const TOTAL_TEAM_BUDGET = CPL_2026.auctionBudget;
```

- [ ] **Step 6: Point App.js at the config**

In `src/App.js`, add to the imports (after the existing `auctionUtils` import on line 11):

```js
import { CPL_2026 } from './config/cpl2026';
```

Replace line 24:

```js
    maxTokens: 1200, // Updated to new budget
```

with:

```js
    maxTokens: CPL_2026.auctionBudget,
```

Replace line 179:

```js
          maxTokens: 1000,
```

with:

```js
          maxTokens: CPL_2026.auctionBudget,
```

- [ ] **Step 7: Verify the app still builds**

Run: `npx react-scripts build`
Expected: `Compiled successfully.` (warnings about unused variables are pre-existing and acceptable; errors are not).

- [ ] **Step 8: Commit**

```bash
git add src/config/cpl2026.js src/config/cpl2026.test.js src/utils/auctionUtils.js src/App.js
git commit -m "Add CPL 2026 rules config as single source of truth"
```

---

### Task 2: Database migration

Adds the four missing columns, widens the status constraint, and adds the constraints that back client-side validation.

**Files:**
- Create: `sql/2026_pre_auction_migration.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: `players.availability`, `players.pre_auction_role`, `teams.pre_auction_submitted`, `teams.pre_auction_submitted_at`. Status accepts `PreAuction`.

- [ ] **Step 1: Write the migration**

Create `sql/2026_pre_auction_migration.sql`:

```sql
-- CPL 2026 pre-auction migration
-- Run in the Supabase SQL editor.
-- Safe to run more than once.
--
-- Verified 2026-08-15 against the live database:
--   * all tables empty
--   * is_captain / is_vice_captain ALREADY EXIST (not added here)
--   * no players -> teams foreign key; sold_to holds a TEAM NAME as free text

-- 1. New columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'Unknown';
ALTER TABLE players ADD COLUMN IF NOT EXISTS pre_auction_role TEXT;

ALTER TABLE teams ADD COLUMN IF NOT EXISTS pre_auction_submitted BOOLEAN DEFAULT FALSE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS pre_auction_submitted_at TIMESTAMPTZ;

-- 2. Value constraints
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_availability_check;
ALTER TABLE players ADD CONSTRAINT players_availability_check
  CHECK (availability IN ('Unknown', 'Available', 'Unavailable'));

ALTER TABLE players DROP CONSTRAINT IF EXISTS players_pre_auction_role_check;
ALTER TABLE players ADD CONSTRAINT players_pre_auction_role_check
  CHECK (pre_auction_role IS NULL OR pre_auction_role IN ('Captain', 'ViceCaptain', 'Squad'));

-- 3. Widen status to admit PreAuction
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_status_check;
ALTER TABLE players ADD CONSTRAINT players_status_check
  CHECK (status IN ('Available', 'Sold', 'Unsold', 'PreAuction'));

-- 4. At most one Captain and one Vice-Captain per team.
--    "At least one" and the three-Squad cap cannot be expressed as indexes;
--    they are enforced at upload time in src/utils/preAuctionRules.js.
CREATE UNIQUE INDEX IF NOT EXISTS one_captain_per_team
  ON players(sold_to) WHERE pre_auction_role = 'Captain';
CREATE UNIQUE INDEX IF NOT EXISTS one_vc_per_team
  ON players(sold_to) WHERE pre_auction_role = 'ViceCaptain';

-- 5. Default team budget for 2026
ALTER TABLE teams ALTER COLUMN max_tokens SET DEFAULT 1000;
ALTER TABLE teams ALTER COLUMN tokens_left SET DEFAULT 1000;
```

- [ ] **Step 2: Apply it**

Open the Supabase SQL editor for project `wtfpchtyungncrwzreft`, paste the file contents, run.
Expected: `Success. No rows returned.`

- [ ] **Step 3: Verify the columns now exist**

Run from the repo root (reads the key from `.env.local`; never prints it):

```bash
KEY=$(grep -m1 '^REACT_APP_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2- | tr -d '\r"')
URL=$(grep -m1 '^REACT_APP_SUPABASE_URL=' .env.local | cut -d= -f2- | tr -d '\r"')
for c in availability pre_auction_role; do
  curl -s "$URL/rest/v1/players?select=$c&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"; echo " <- players.$c"
done
for c in pre_auction_submitted pre_auction_submitted_at; do
  curl -s "$URL/rest/v1/teams?select=$c&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"; echo " <- teams.$c"
done
```

Expected: `[]` on every line. Any line containing `does not exist` means the migration did not apply.

- [ ] **Step 4: Commit**

```bash
git add sql/2026_pre_auction_migration.sql
git commit -m "Add 2026 pre-auction schema migration"
```

---

### Task 3: Pre-auction validation rules

Pure functions, no React and no Supabase. This is where a defect would be silent and expensive, so it is tested first and hardest.

**Files:**
- Create: `src/utils/preAuctionRules.js`
- Create: `src/utils/preAuctionRules.test.js`

**Interfaces:**
- Consumes: `CPL_2026` from `src/config/cpl2026.js`.
- Produces:
  - `PLAYER_ROLES: string[]`
  - `PRE_AUCTION_ROLES: string[]`
  - `AVAILABILITY_VALUES: string[]`
  - `validatePreAuctionUpload(teamRows, playerRows) => { valid: boolean, errors: string[], warnings: string[] }`
  - `normalizePreAuctionRows(playerRows) => Array<{player_id, name, role, base_tokens, photo_filename, department, availability, pre_auction_role, sold_to, sold_price, status, is_captain, is_vice_captain}>`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/preAuctionRules.test.js`:

```js
import { validatePreAuctionUpload, normalizePreAuctionRows } from './preAuctionRules';

const teams = [
  { TeamID: 'CPL_T01', TeamName: 'Avengers', LogoFile: 'Avengers.png' },
  { TeamID: 'CPL_T06', TeamName: 'Pirates', LogoFile: 'Pirates.png' }
];

// Builds a valid five for one team.
const five = (team, idPrefix) => [
  { TeamName: team, PlayerID: idPrefix + '1', Name: 'A', Role: 'Batsman', BaseTokens: 100, PreAuctionRole: 'Captain', Availability: 'Available' },
  { TeamName: team, PlayerID: idPrefix + '2', Name: 'B', Role: 'Bowler', BaseTokens: 100, PreAuctionRole: 'ViceCaptain', Availability: 'Available' },
  { TeamName: team, PlayerID: idPrefix + '3', Name: 'C', Role: 'WicketKeeper', BaseTokens: 100, PreAuctionRole: 'Squad', Availability: 'Available' },
  { TeamName: team, PlayerID: idPrefix + '4', Name: 'D', Role: 'All-rounder', BaseTokens: 100, PreAuctionRole: 'Squad', Availability: 'Available' },
  { TeamName: team, PlayerID: idPrefix + '5', Name: 'E', Role: 'Batsman', BaseTokens: 100, PreAuctionRole: 'Squad', Availability: 'Available' }
];

const bothTeams = () => [...five('Avengers', 'AV'), ...five('Pirates', 'PI')];

test('a well-formed workbook passes', () => {
  const result = validatePreAuctionUpload(teams, bothTeams());
  expect(result.errors).toEqual([]);
  expect(result.valid).toBe(true);
});

test('a team with two captains fails', () => {
  const rows = bothTeams();
  rows[1].PreAuctionRole = 'Captain'; // Avengers now has 2 Captains, 0 ViceCaptain
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Avengers/);
  expect(result.errors.join(' ')).toMatch(/Captain/);
});

test('a team with only four players fails', () => {
  const rows = bothTeams().slice(1);
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Avengers/);
});

test('a duplicate PlayerID fails', () => {
  const rows = bothTeams();
  rows[5].PlayerID = 'AV1';
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/AV1/);
});

test('an unknown team name fails', () => {
  const rows = bothTeams();
  rows[0].TeamName = 'Nonexistent United';
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Nonexistent United/);
});

test('an invalid player role fails', () => {
  const rows = bothTeams();
  rows[0].Role = 'Allrounder'; // missing hyphen
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Allrounder/);
});

test('an invalid pre-auction role fails', () => {
  const rows = bothTeams();
  rows[2].PreAuctionRole = 'Retained';
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Retained/);
});

test('a missing BaseTokens fails', () => {
  const rows = bothTeams();
  delete rows[3].BaseTokens;
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/BaseTokens/);
});

test('unconfirmed availability warns but does not block', () => {
  const rows = bothTeams();
  rows[0].Availability = 'Unknown';
  rows[1].Availability = 'Unavailable';
  const result = validatePreAuctionUpload(teams, rows);
  expect(result.valid).toBe(true);
  expect(result.warnings).toHaveLength(2);
  expect(result.warnings.join(' ')).toMatch(/Avengers/);
});

test('a team present in Teams but absent from PreAuction fails', () => {
  const result = validatePreAuctionUpload(teams, five('Avengers', 'AV'));
  expect(result.valid).toBe(false);
  expect(result.errors.join(' ')).toMatch(/Pirates/);
});

test('normalize maps a Captain row to database columns', () => {
  const [row] = normalizePreAuctionRows([five('Avengers', 'AV')[0]]);
  expect(row).toEqual({
    player_id: 'AV1',
    name: 'A',
    role: 'Batsman',
    base_tokens: 100,
    photo_filename: null,
    department: null,
    availability: 'Available',
    pre_auction_role: 'Captain',
    sold_to: 'Avengers',
    sold_price: 0,
    status: 'PreAuction',
    is_captain: true,
    is_vice_captain: false
  });
});

test('normalize defaults availability to Unknown and mirrors ViceCaptain', () => {
  const source = five('Avengers', 'AV')[1];
  delete source.Availability;
  const [row] = normalizePreAuctionRows([source]);
  expect(row.availability).toBe('Unknown');
  expect(row.is_captain).toBe(false);
  expect(row.is_vice_captain).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx react-scripts test --watchAll=false --testPathPattern=preAuctionRules`
Expected: FAIL — `Cannot find module './preAuctionRules'`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/preAuctionRules.js`:

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx react-scripts test --watchAll=false --testPathPattern=preAuctionRules`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/preAuctionRules.js src/utils/preAuctionRules.test.js
git commit -m "Add pre-auction upload validation rules"
```

---

### Task 4: Supabase pre-auction service methods

Adds the write path, the reopen path, and fixes squad population on load.

**Files:**
- Modify: `src/services/supabaseService.js` — `loadData` (lines 22–82), plus three new methods.

**Interfaces:**
- Consumes: `normalizePreAuctionRows` from `src/utils/preAuctionRules.js`; `CPL_2026` from `src/config/cpl2026.js`.
- Produces on `supabaseAuctionService`:
  - `uploadPreAuctionSquads(teamRows, normalizedPlayers) => Promise<{success, message}|{success:false, error}>`
  - `reopenTeam(teamName) => Promise<{success}|{success:false, error}>`
  - `loadData()` now returns teams whose `squad` arrays are populated, and each team gains `preAuctionSubmitted` (boolean) and `preAuctionSubmittedAt` (string|null).

- [ ] **Step 1: Add the imports**

At the top of `src/services/supabaseService.js`, after line 1 (`import { createClient } ...`):

```js
import { CPL_2026 } from '../config/cpl2026';
```

- [ ] **Step 2: Fix squad population in loadData**

In `src/services/supabaseService.js`, inside `loadData`, replace the team-mapping block that currently starts at line 40 (`teamsData.forEach(team => {`) and the player-mapping block, so that players are mapped first and then folded into their team's squad. Replace everything from `      // Convert to same format as Excel service` through `      return { players, teams };` with:

```js
      // Convert players first so squads can be populated from them.
      const players = playersData.map(player => ({
        PlayerID: player.player_id,
        Name: player.name,
        Role: player.role,
        BaseTokens: player.base_tokens,
        PhotoFileName: player.photo_filename,
        Department: player.department,
        Status: player.status,
        SoldTo: player.sold_to,
        SoldPrice: player.sold_price,
        Availability: player.availability || 'Unknown',
        PreAuctionRole: player.pre_auction_role || null,
        IsCaptain: player.is_captain || false,
        IsViceCaptain: player.is_vice_captain || false
      }));

      const teams = {};
      teamsData.forEach(team => {
        teams[team.team_name] = {
          id: team.team_id,
          logo: team.logo_file,
          tokensLeft: team.tokens_left,
          squad: [],
          maxTokens: team.max_tokens,
          maxSquadSize: team.max_squad_size,
          preAuctionSubmitted: team.pre_auction_submitted || false,
          preAuctionSubmittedAt: team.pre_auction_submitted_at || null,
          roleCount: {
            'Batsman': 0,
            'Bowler': 0,
            'WicketKeeper': 0,
            'All-rounder': 0
          },
          categoryBudgets: {
            'Batsman': { spent: team.batsman_budget_spent || 0, remaining: team.batsman_budget_remaining || 0, max: CPL_2026.advisoryCategorySpend['Batsman'] },
            'Bowler': { spent: team.bowler_budget_spent || 0, remaining: team.bowler_budget_remaining || 0, max: CPL_2026.advisoryCategorySpend['Bowler'] },
            'All-rounder': { spent: team.allrounder_budget_spent || 0, remaining: team.allrounder_budget_remaining || 0, max: CPL_2026.advisoryCategorySpend['All-rounder'] },
            'WicketKeeper': { spent: team.wicketkeeper_budget_spent || 0, remaining: team.wicketkeeper_budget_remaining || 0, max: CPL_2026.advisoryCategorySpend['WicketKeeper'] }
          }
        };
      });

      // Populate each team's squad from the players table. Without this, squads
      // are empty on every page load and pre-auction players never appear.
      players.forEach(player => {
        const isOnATeam = player.Status === 'Sold' || player.Status === 'PreAuction';
        if (!isOnATeam || !player.SoldTo) return;

        const team = teams[player.SoldTo];
        if (!team) return;

        team.squad.push({ ...player, BidPrice: player.SoldPrice || 0 });
        if (team.roleCount[player.Role] !== undefined) {
          team.roleCount[player.Role] += 1;
        }
      });

      return { players, teams };
```

- [ ] **Step 3: Add the pre-auction write method**

In `src/services/supabaseService.js`, add this method to the `SupabaseAuctionService` class, immediately before `async resetAuctionData() {`:

```js
  /**
   * Writes a validated pre-auction workbook.
   *
   * Teams are upserted first so the players' sold_to values always point at a
   * team that exists. Callers MUST have run validatePreAuctionUpload first —
   * this method does not re-validate.
   */
  async uploadPreAuctionSquads(teamRows, normalizedPlayers) {
    try {
      const submittedAt = new Date().toISOString();

      const { error: teamsError } = await supabase
        .from('teams')
        .upsert(teamRows.map(team => ({
          team_id: team.TeamID,
          team_name: team.TeamName,
          logo_file: team.LogoFile || null,
          max_tokens: CPL_2026.auctionBudget,
          tokens_left: CPL_2026.auctionBudget,
          max_squad_size: CPL_2026.defaultSquadSize,
          // Advisory display figures only — never enforced. Seeded here so the
          // category panels agree with the config instead of the stale schema
          // defaults (400/400/200/150).
          batsman_budget_spent: 0,
          batsman_budget_remaining: CPL_2026.advisoryCategorySpend['Batsman'],
          bowler_budget_spent: 0,
          bowler_budget_remaining: CPL_2026.advisoryCategorySpend['Bowler'],
          allrounder_budget_spent: 0,
          allrounder_budget_remaining: CPL_2026.advisoryCategorySpend['All-rounder'],
          wicketkeeper_budget_spent: 0,
          wicketkeeper_budget_remaining: CPL_2026.advisoryCategorySpend['WicketKeeper'],
          batsman_count: 0,
          bowler_count: 0,
          allrounder_count: 0,
          wicketkeeper_count: 0,
          pre_auction_submitted: true,
          pre_auction_submitted_at: submittedAt
        })), { onConflict: 'team_id', ignoreDuplicates: false });

      if (teamsError) throw teamsError;

      const { error: playersError } = await supabase
        .from('players')
        .upsert(normalizedPlayers, { onConflict: 'player_id', ignoreDuplicates: false });

      if (playersError) throw playersError;

      return {
        success: true,
        message: `Loaded ${normalizedPlayers.length} pre-auction players across ${teamRows.length} teams`
      };
    } catch (error) {
      console.error('Error uploading pre-auction squads:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unlocks a team so its five can be re-uploaded.
   *
   * Releases the team's pre-auction players back to the auction pool. A player
   * dropped from the re-uploaded sheet therefore stays in the database and
   * becomes available for bidding, which is the intended outcome.
   */
  async reopenTeam(teamName) {
    try {
      const { error: playersError } = await supabase
        .from('players')
        .update({
          status: 'Available',
          sold_to: null,
          sold_price: 0,
          pre_auction_role: null,
          is_captain: false,
          is_vice_captain: false
        })
        .eq('sold_to', teamName)
        .eq('status', 'PreAuction');

      if (playersError) throw playersError;

      const { error: teamError } = await supabase
        .from('teams')
        .update({ pre_auction_submitted: false, pre_auction_submitted_at: null })
        .eq('team_name', teamName);

      if (teamError) throw teamError;

      return { success: true };
    } catch (error) {
      console.error('Error reopening team:', error);
      return { success: false, error: error.message };
    }
  }
```

- [ ] **Step 4: Verify the build**

Run: `npx react-scripts build`
Expected: `Compiled successfully.`

- [ ] **Step 5: Commit**

```bash
git add src/services/supabaseService.js
git commit -m "Add pre-auction squad upload and populate squads on load"
```

---

### Task 5: Upload workbook template generator

Produces the blank workbook the organiser fills in, pre-filled with the eight teams and the logo filenames that actually exist in `public/`.

**Files:**
- Create: `scripts/create_pre_auction_template.js`

**Interfaces:**
- Consumes: `xlsx` (already a devDependency).
- Produces: `data/CPL_2026_PreAuction_Template.xlsx` with sheets `Teams` (8 rows) and `PreAuction` (40 blank rows, team names pre-filled).

- [ ] **Step 1: Write the generator**

Create `scripts/create_pre_auction_template.js`:

```js
/**
 * Generates the blank CPL 2026 pre-auction upload workbook.
 *
 * Usage: node scripts/create_pre_auction_template.js
 *
 * Team names are unchanged from 2025. Logo filenames are the ones that
 * actually exist in public/ — scripts/update_team_names_and_logos.py is stale
 * and names two files that are not there.
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const TEAMS = [
  { TeamID: 'CPL_T01', TeamName: 'Avengers',         LogoFile: 'Avengers.png' },
  { TeamID: 'CPL_T02', TeamName: 'Fearless Falcons', LogoFile: 'Feralessfalcons.png' },
  { TeamID: 'CPL_T03', TeamName: 'Hits & Misses',    LogoFile: 'HitsMisses.png' },
  { TeamID: 'CPL_T04', TeamName: 'Mavericks',        LogoFile: 'Mavericks.png' },
  { TeamID: 'CPL_T05', TeamName: 'Quality Strikers', LogoFile: 'quality_strikers.png' },
  { TeamID: 'CPL_T06', TeamName: 'Pirates',          LogoFile: 'Pirates.png' },
  { TeamID: 'CPL_T07', TeamName: 'CSK',              LogoFile: 'csk.png' },
  { TeamID: 'CPL_T08', TeamName: 'Digititans',       LogoFile: 'digititans.png' }
];

const SLOTS = ['Captain', 'ViceCaptain', 'Squad', 'Squad', 'Squad'];

const playerRows = [];
TEAMS.forEach(team => {
  SLOTS.forEach(slot => {
    playerRows.push({
      TeamName: team.TeamName,
      PlayerID: '',
      Name: '',
      Role: '',
      BaseTokens: '',
      PreAuctionRole: slot,
      Availability: 'Unknown',
      PhotoFileName: '',
      Department: ''
    });
  });
});

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(TEAMS), 'Teams');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(playerRows), 'PreAuction');

const outDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'CPL_2026_PreAuction_Template.xlsx');
XLSX.writeFile(wb, outPath);

console.log('Wrote ' + outPath);
console.log(TEAMS.length + ' teams, ' + playerRows.length + ' player rows');
console.log('');
console.log('Fill in PlayerID, Name, Role and BaseTokens for all 40 rows.');
console.log('Role must be one of: Batsman, Bowler, All-rounder, WicketKeeper');
console.log('Set Availability to Available once a player has confirmed 12 Sep - 4 Oct.');
```

- [ ] **Step 2: Run it**

Run: `node scripts/create_pre_auction_template.js`
Expected output:

```
Wrote .../data/CPL_2026_PreAuction_Template.xlsx
8 teams, 40 player rows
```

- [ ] **Step 3: Verify the generated workbook**

Run:

```bash
node -e "const X=require('xlsx');const wb=X.readFile('data/CPL_2026_PreAuction_Template.xlsx');console.log(wb.SheetNames);console.log(X.utils.sheet_to_json(wb.Sheets.PreAuction).length+' player rows');"
```

Expected: `[ 'Teams', 'PreAuction' ]` then `40 player rows`.

- [ ] **Step 4: Commit**

```bash
git add scripts/create_pre_auction_template.js
git commit -m "Add pre-auction upload template generator"
```

---

### Task 6: Pre-auction upload mode in ExcelUpload

Adds a second, clearly separated upload mode. The existing player/team upload path is left untouched.

**Files:**
- Modify: `src/components/ExcelUpload.js`

**Interfaces:**
- Consumes: `validatePreAuctionUpload`, `normalizePreAuctionRows` from `src/utils/preAuctionRules.js`; `supabaseAuctionService.uploadPreAuctionSquads`.
- Produces: `ExcelUpload` accepts a new optional prop `mode` (`'players'` | `'preauction'`, default `'players'`).

- [ ] **Step 1: Add the imports**

In `src/components/ExcelUpload.js`, replace line 4:

```js
import { supabaseAuctionService } from '../services/supabaseService';
```

with:

```js
import { supabaseAuctionService } from '../services/supabaseService';
import { validatePreAuctionUpload, normalizePreAuctionRows } from '../utils/preAuctionRules';
```

- [ ] **Step 2: Accept the mode prop**

Replace line 7:

```js
const ExcelUpload = ({ onDataLoaded }) => {
```

with:

```js
const ExcelUpload = ({ onDataLoaded, mode = 'players' }) => {
  const isPreAuction = mode === 'preauction';
```

- [ ] **Step 3: Add the pre-auction parser**

In `src/components/ExcelUpload.js`, insert this function immediately after the closing brace of `processExcelFile` (after line 78) and before `const handleFileUpload`:

```js
  const processPreAuctionFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });

          if (!workbook.SheetNames.includes('Teams')) {
            throw new Error("Workbook must contain a sheet named 'Teams'.");
          }
          if (!workbook.SheetNames.includes('PreAuction')) {
            throw new Error("Workbook must contain a sheet named 'PreAuction'.");
          }

          const teamRows = XLSX.utils.sheet_to_json(workbook.Sheets['Teams']);
          const playerRows = XLSX.utils.sheet_to_json(workbook.Sheets['PreAuction']);

          resolve({ teamRows, playerRows });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handlePreAuctionUpload = async (file) => {
    setUploading(true);
    const uploadToast = toast.loading('Reading pre-auction workbook...');

    try {
      const { teamRows, playerRows } = await processPreAuctionFile(file);

      const { valid, errors, warnings } = validatePreAuctionUpload(teamRows, playerRows);

      if (!valid) {
        // Nothing is written when validation fails — a partial write would
        // leave some teams locked and others not.
        toast.dismiss(uploadToast);
        setValidationErrors(errors);
        toast.error(`${errors.length} problem(s) found. Nothing was uploaded.`, { duration: 6000 });
        return;
      }

      setValidationErrors([]);
      toast.loading('Uploading pre-auction squads...', { id: uploadToast });

      const result = await supabaseAuctionService.uploadPreAuctionSquads(
        teamRows,
        normalizePreAuctionRows(playerRows)
      );

      if (!result.success) throw new Error(result.error);

      toast.success(result.message, { id: uploadToast, duration: 4000 });

      warnings.forEach(w => toast(w, { icon: '⚠️', duration: 6000 }));

      if (onDataLoaded) onDataLoaded();
    } catch (error) {
      console.error('Error uploading pre-auction file:', error);
      toast.error(`Upload failed: ${error.message}`, { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };
```

- [ ] **Step 4: Add the error state and route by mode**

Replace line 9:

```js
  const [dragActive, setDragActive] = useState(false);
```

with:

```js
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
```

Then, inside `handleFileUpload`, replace lines 88–89:

```js
    setUploading(true);
    const uploadToast = toast.loading('Processing Excel file...');
```

with:

```js
    if (isPreAuction) {
      await handlePreAuctionUpload(file);
      return;
    }

    setUploading(true);
    const uploadToast = toast.loading('Processing Excel file...');
```

- [ ] **Step 5: Show the errors and mode-specific instructions**

In `src/components/ExcelUpload.js`, replace the entire `{/* File Requirements */}` block (lines 195–207) with:

```jsx
      {/* Validation errors — pre-auction mode only */}
      {validationErrors.length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
            <AlertCircle size={16} />
            {validationErrors.length} problem(s) — nothing was uploaded
          </h4>
          <ul className="text-sm text-red-700 space-y-1 max-h-64 overflow-y-auto list-disc list-inside">
            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {/* File Requirements */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <AlertCircle size={16} />
          Excel File Requirements
        </h4>
        {isPreAuction ? (
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Sheet "Teams":</strong> TeamID, TeamName, LogoFile</p>
            <p><strong>Sheet "PreAuction":</strong> TeamName, PlayerID, Name, Role, BaseTokens, PreAuctionRole, Availability (optional), PhotoFileName (optional), Department (optional)</p>
            <p><strong>PreAuctionRole:</strong> Captain, ViceCaptain, Squad — exactly 1 Captain, 1 ViceCaptain and 3 Squad per team</p>
            <p><strong>Supported Roles:</strong> Batsman, Bowler, All-rounder, WicketKeeper</p>
            <p><strong>Note:</strong> The whole workbook is validated before anything is written. These five players cost no coins.</p>
            <p>Generate a blank template with <code>node scripts/create_pre_auction_template.js</code></p>
          </div>
        ) : (
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Sheet 1 - Players:</strong> PlayerID, Name, Role, BaseTokens, PhotoFileName (optional), Department (optional)</p>
            <p><strong>Sheet 2 - Teams:</strong> TeamID, TeamName, LogoFile (optional)</p>
            <p><strong>Supported Roles:</strong> Batsman, Bowler, All-rounder, WicketKeeper</p>
            <p><strong>Note:</strong> Players already locked in as pre-auction picks are never overwritten</p>
          </div>
        )}
      </div>
```

Also replace the heading text on line 166–168:

```jsx
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {uploading ? 'Processing Excel File...' : 'Upload Excel Data'}
            </h3>
```

with:

```jsx
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {uploading
                ? 'Processing Excel File...'
                : isPreAuction ? 'Upload Pre-Auction Squads' : 'Upload Excel Data'}
            </h3>
```

- [ ] **Step 6: Verify the build**

Run: `npx react-scripts build`
Expected: `Compiled successfully.`

- [ ] **Step 7: Commit**

```bash
git add src/components/ExcelUpload.js
git commit -m "Add pre-auction upload mode to ExcelUpload"
```

---

### Task 7: Pre-auction review tab

Shows all eight teams, who is missing, and provides reopen. Must be reachable **before** the auction starts — `AdminPage` currently renders `AuctionSetup` and no tabs at all while `auctionStarted` is false.

**Files:**
- Create: `src/components/PreAuctionReview.js`
- Modify: `src/components/AdminPage.js:151-158`

**Interfaces:**
- Consumes: `auctionState.teams` (each team has `squad`, `preAuctionSubmitted`, `preAuctionSubmittedAt`, `tokensLeft`); `supabaseAuctionService.reopenTeam`; `CPL_2026`.
- Produces: `PreAuctionReview` component taking props `{ teams, loadAuctionData }`.

- [ ] **Step 1: Create the component**

Create `src/components/PreAuctionReview.js`:

```jsx
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
```

- [ ] **Step 2: Make it reachable before the auction starts**

In `src/components/AdminPage.js`, add to the imports after line 14 (`import DataCleanup from './DataCleanup';`):

```js
import PreAuctionReview from './PreAuctionReview';
```

Add this state next to the existing `activeTab` state (after line 32):

```js
  const [setupTab, setSetupTab] = useState('preauction');
```

Then replace the `!auctionState.auctionStarted` branch — lines 151 to 158, currently:

```jsx
        {!auctionState.auctionStarted ? (
          <AuctionSetup
            auctionState={auctionState}
            setAuctionState={setAuctionState}
            loadAuctionData={loadAuctionData}
            startAuction={startAuction}
            loading={loading}
          />
        ) : (
```

with:

```jsx
        {!auctionState.auctionStarted ? (
          <div className="auction-container rounded-xl p-4 md:p-6 shadow-2xl bg-white/95 backdrop-blur-sm">
            <div className="flex gap-2 mb-6 bg-gray-100 p-2 rounded-lg">
              {[
                { id: 'preauction', label: 'Pre-Auction 2026' },
                { id: 'setup', label: 'Auction Setup' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSetupTab(tab.id)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    setupTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xl'
                      : 'text-gray-600 hover:bg-white hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {setupTab === 'preauction' ? (
              <PreAuctionReview
                teams={auctionState.teams}
                loadAuctionData={loadAuctionData}
              />
            ) : (
              <AuctionSetup
                auctionState={auctionState}
                setAuctionState={setAuctionState}
                loadAuctionData={loadAuctionData}
                startAuction={startAuction}
                loading={loading}
              />
            )}
          </div>
        ) : (
```

- [ ] **Step 3: Verify the build**

Run: `npx react-scripts build`
Expected: `Compiled successfully.`

- [ ] **Step 4: Manual smoke test**

Run: `npm start`, open `http://localhost:3000`, click **Admin panel**, enter `admin123`.
Expected: the **Pre-Auction 2026** tab is selected by default and shows "0 of 0 teams submitted" plus the upload box. Fill in a copy of `data/CPL_2026_PreAuction_Template.xlsx` with test data, upload it, and confirm all eight teams appear with five players each and 🪙 1000. Click **Reopen** on one team and confirm it returns to "Not submitted".

- [ ] **Step 5: Commit**

```bash
git add src/components/PreAuctionReview.js src/components/AdminPage.js
git commit -m "Add pre-auction review tab with reopen"
```

---

### Task 8: Protect PreAuction rows during the registered-player upload

The registration list is uploaded after 18 August through the existing path, which sets `status` and `sold_to` on every row and would silently wipe every pre-auction assignment.

**Files:**
- Modify: `src/services/supabaseService.js` — `uploadExcelData` (lines 174–241), `mergeExcelData` (lines 244–317)

**Interfaces:**
- Consumes: `supabase` client already in the module.
- Produces: both upload methods leave existing `PreAuction` rows untouched.

- [ ] **Step 1: Write the failing test**

Create `src/utils/preAuctionGuard.test.js`:

```js
import { splitOutPreAuctionPlayers } from './preAuctionGuard';

test('players already locked as PreAuction are held back', () => {
  const incoming = [
    { PlayerID: 'AV1', Name: 'A' },
    { PlayerID: 'NEW1', Name: 'N' }
  ];
  const locked = ['AV1'];

  const { safeToWrite, skipped } = splitOutPreAuctionPlayers(incoming, locked);

  expect(safeToWrite.map(p => p.PlayerID)).toEqual(['NEW1']);
  expect(skipped).toEqual(['AV1']);
});

test('nothing is held back when no players are locked', () => {
  const incoming = [{ PlayerID: 'NEW1', Name: 'N' }];
  const { safeToWrite, skipped } = splitOutPreAuctionPlayers(incoming, []);
  expect(safeToWrite).toHaveLength(1);
  expect(skipped).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx react-scripts test --watchAll=false --testPathPattern=preAuctionGuard`
Expected: FAIL — `Cannot find module './preAuctionGuard'`.

- [ ] **Step 3: Write the guard**

Create `src/utils/preAuctionGuard.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx react-scripts test --watchAll=false --testPathPattern=preAuctionGuard`
Expected: PASS, 2 tests.

- [ ] **Step 5: Wire the guard into both upload methods**

In `src/services/supabaseService.js`, add to the imports:

```js
import { splitOutPreAuctionPlayers } from '../utils/preAuctionGuard';
```

Add this helper method to `SupabaseAuctionService`, immediately before `async uploadExcelData(`:

```js
  /** player_id values currently locked into a team's pre-auction five. */
  async getPreAuctionPlayerIds() {
    const { data, error } = await supabase
      .from('players')
      .select('player_id')
      .eq('status', 'PreAuction');

    if (error) throw error;
    return (data || []).map(row => row.player_id);
  }
```

In `uploadExcelData`, replace the destructive delete and the insert. Replace lines 181–184:

```js
      // Clear existing data (optional - remove if you want to keep existing data)
      await supabase.from('players').delete().neq('id', 0);
      await supabase.from('teams').delete().neq('id', 0);
```

with:

```js
      // Never delete players locked into a team's pre-auction five.
      const lockedIds = await this.getPreAuctionPlayerIds();

      if (lockedIds.length > 0) {
        await supabase.from('players').delete().neq('status', 'PreAuction');
      } else {
        await supabase.from('players').delete().neq('id', 0);
        await supabase.from('teams').delete().neq('id', 0);
      }
```

Then, still in `uploadExcelData`, replace line 207–209:

```js
      // Insert players
      const { error: playersError } = await supabase
        .from('players')
        .insert(players.map((player, index) => ({
```

with:

```js
      // Insert players, holding back anyone already locked in pre-auction.
      const { safeToWrite, skipped } = splitOutPreAuctionPlayers(players, lockedIds);
      if (skipped.length > 0) {
        console.log(`Skipped ${skipped.length} pre-auction players:`, skipped);
      }

      const { error: playersError } = await supabase
        .from('players')
        .insert(safeToWrite.map((player, index) => ({
```

Then update the success message at line 230–231 from:

```js
        message: `Successfully uploaded ${players.length} players and ${teams.length} teams`
```

to:

```js
        message: skipped.length > 0
          ? `Uploaded ${safeToWrite.length} players and ${teams.length} teams (${skipped.length} pre-auction players preserved)`
          : `Successfully uploaded ${players.length} players and ${teams.length} teams`
```

Apply the same treatment in `mergeExcelData`: after the teams upsert succeeds, replace line 277–279:

```js
      // 2. Upsert players (insert or update)
      const { error: playersError } = await supabase
        .from('players')
        .upsert(players.map((player, index) => ({
```

with:

```js
      // 2. Upsert players, holding back anyone already locked in pre-auction.
      const lockedIds = await this.getPreAuctionPlayerIds();
      const { safeToWrite, skipped } = splitOutPreAuctionPlayers(players, lockedIds);
      if (skipped.length > 0) {
        console.log(`Skipped ${skipped.length} pre-auction players:`, skipped);
      }

      const { error: playersError } = await supabase
        .from('players')
        .upsert(safeToWrite.map((player, index) => ({
```

And update its return at line 305–307 from:

```js
        playersProcessed: players.length,
        teamsProcessed: teams.length,
        message: `Successfully merged ${players.length} players and ${teams.length} teams`
```

to:

```js
        playersProcessed: safeToWrite.length,
        teamsProcessed: teams.length,
        message: `Merged ${safeToWrite.length} players and ${teams.length} teams` +
          (skipped.length > 0 ? ` (${skipped.length} pre-auction players preserved)` : '')
```

- [ ] **Step 6: Verify the build and full test suite**

Run: `npx react-scripts build && npx react-scripts test --watchAll=false`
Expected: `Compiled successfully.` and all tests passing.

- [ ] **Step 7: Commit**

```bash
git add src/utils/preAuctionGuard.js src/utils/preAuctionGuard.test.js src/services/supabaseService.js
git commit -m "Never overwrite pre-auction players on player upload"
```

---

### Task 9: Auction bid caps and wicket-keeper warning

Replaces the category spend caps as hard rules with the published per-player maximum bid.

**Files:**
- Create: `src/utils/bidRules.js`
- Create: `src/utils/bidRules.test.js`
- Modify: `src/components/LiveAuction.js:53-71`

**Interfaces:**
- Consumes: `CPL_2026`.
- Produces:
  - `maxBidFor(role) => number`
  - `validateBid(team, playerRole, price) => { valid: boolean, reason: string|null }`
  - `needsWicketKeeper(team) => boolean`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/bidRules.test.js`:

```js
import { maxBidFor, validateBid, needsWicketKeeper } from './bidRules';

const team = (overrides = {}) => ({
  tokensLeft: 1000,
  maxSquadSize: 15,
  squad: [],
  roleCount: { Batsman: 0, Bowler: 0, WicketKeeper: 0, 'All-rounder': 0 },
  ...overrides
});

test('max bid comes from the published category limits', () => {
  expect(maxBidFor('WicketKeeper')).toBe(150);
  expect(maxBidFor('Batsman')).toBe(250);
  expect(maxBidFor('Bowler')).toBe(250);
  expect(maxBidFor('All-rounder')).toBe(350);
});

test('a bid at the category maximum is allowed', () => {
  expect(validateBid(team(), 'Batsman', 250).valid).toBe(true);
});

test('a bid one coin over the category maximum is rejected', () => {
  const result = validateBid(team(), 'Batsman', 251);
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/250/);
});

test('a wicket keeper cannot exceed 150 even with a full purse', () => {
  const result = validateBid(team(), 'WicketKeeper', 200);
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/150/);
});

test('a bid above the remaining purse is rejected', () => {
  const result = validateBid(team({ tokensLeft: 40 }), 'Batsman', 50);
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/purse|coins/i);
});

test('a full squad is rejected', () => {
  const full = team({ squad: new Array(15).fill({}), maxSquadSize: 15 });
  const result = validateBid(full, 'Batsman', 10);
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/squad/i);
});

test('category spend caps never block a bid', () => {
  const overspent = team({
    categoryBudgets: { Batsman: { spent: 999, remaining: -999, max: 420 } }
  });
  expect(validateBid(overspent, 'Batsman', 250).valid).toBe(true);
});

test('a team with no keeper and one slot left needs a keeper', () => {
  const t = team({ squad: new Array(14).fill({}), maxSquadSize: 15 });
  expect(needsWicketKeeper(t)).toBe(true);
});

test('a team that already has a keeper does not need one', () => {
  const t = team({
    squad: new Array(14).fill({}),
    maxSquadSize: 15,
    roleCount: { Batsman: 0, Bowler: 0, WicketKeeper: 1, 'All-rounder': 0 }
  });
  expect(needsWicketKeeper(t)).toBe(false);
});

test('a team with plenty of slots left does not trigger the warning', () => {
  expect(needsWicketKeeper(team({ squad: new Array(5).fill({}) }))).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx react-scripts test --watchAll=false --testPathPattern=bidRules`
Expected: FAIL — `Cannot find module './bidRules'`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/bidRules.js`:

```js
import { CPL_2026 } from '../config/cpl2026';

/** Published maximum bid for a category. Unknown roles fall back to the budget. */
export function maxBidFor(role) {
  const max = CPL_2026.maxBidByCategory[role];
  return max === undefined ? CPL_2026.auctionBudget : max;
}

/**
 * The three hard rules for CPL 2026. Category spend caps are advisory and are
 * deliberately NOT checked here — blocking on a rule that is not in the
 * published document cannot be explained to a room mid-auction.
 */
export function validateBid(team, playerRole, price) {
  if (!team) return { valid: false, reason: 'No team selected.' };

  if (team.squad.length >= team.maxSquadSize) {
    return { valid: false, reason: `Squad is full (${team.maxSquadSize} players).` };
  }

  const max = maxBidFor(playerRole);
  if (price > max) {
    return { valid: false, reason: `${playerRole} bids are capped at ${max} coins.` };
  }

  if (price > team.tokensLeft) {
    return { valid: false, reason: `Only ${team.tokensLeft} coins left in the purse.` };
  }

  return { valid: true, reason: null };
}

/**
 * True when a team is down to its final slot with no wicket keeper.
 * Surfaced as a warning — every squad needs at least one keeper.
 */
export function needsWicketKeeper(team) {
  if (!team) return false;
  const slotsLeft = team.maxSquadSize - team.squad.length;
  const keepers = team.roleCount?.WicketKeeper || 0;
  return keepers < CPL_2026.minWicketKeepers && slotsLeft <= CPL_2026.minWicketKeepers;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx react-scripts test --watchAll=false --testPathPattern=bidRules`
Expected: PASS, 10 tests.

- [ ] **Step 5: Use the rules in LiveAuction**

In `src/components/LiveAuction.js`, add after line 5 (`import CategoryProgress from './CategoryProgress';`):

```js
import { validateBid, maxBidFor, needsWicketKeeper } from '../utils/bidRules';
```

Replace lines 53–71 in full:

```js
  const canAfford = (team, price) => team.tokensLeft >= price;
  const isSquadFull = (team) => team.squad.length >= team.maxSquadSize;
  
  const canAffordCategory = (team, playerRole, price) => {
    if (!team.categoryBudgets || !team.categoryBudgets[playerRole]) return true;
    return team.categoryBudgets[playerRole].remaining >= price;
  };
  
  const hasRoleSpace = (team, playerRole) => {
    if (!team.categoryBudgets || !team.categoryBudgets[playerRole]) return true;
    return team.roleCount[playerRole] < team.categoryBudgets[playerRole].maxPlayers;
  };
  
  const isValidBid = (team, playerRole, price) => {
    return canAfford(team, price) && 
           canAffordCategory(team, playerRole, price) && 
           hasRoleSpace(team, playerRole) && 
           !isSquadFull(team);
  };
```

with:

```js
  // CPL 2026: the only hard rules are the per-player category cap, the team's
  // remaining purse and squad size. Category spend caps are advisory.
  const isValidBid = (team, playerRole, price) =>
    validateBid(team, playerRole, price).valid;

  const bidRejection = currentPlayer && teams[selectedTeam]
    ? validateBid(teams[selectedTeam], currentPlayer.Role, bidPrice).reason
    : null;

  const currentMaxBid = currentPlayer ? maxBidFor(currentPlayer.Role) : 0;

  const keeperWarningTeams = Object.entries(teams)
    .filter(([, team]) => needsWicketKeeper(team))
    .map(([name]) => name);
```

- [ ] **Step 6: Show the cap and the warnings**

In `src/components/LiveAuction.js`, insert this block between the closing `</h2>` on line 147 and the `{/* Category Progress Section */}` comment on line 149:

```jsx
        {currentPlayer && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <strong>Max bid for {currentPlayer.Role}:</strong> 🪙 {currentMaxBid}
            </span>
            {bidRejection && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {bidRejection}
              </span>
            )}
          </div>
        )}

        {keeperWarningTeams.length > 0 && (
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            🧤 Needs a wicket keeper before the squad fills: {keeperWarningTeams.join(', ')}
          </div>
        )}
```

- [ ] **Step 7: Verify the build and full test suite**

Run: `npx react-scripts build && npx react-scripts test --watchAll=false`
Expected: `Compiled successfully.` and all tests passing across all five test files.

- [ ] **Step 8: Commit**

```bash
git add src/utils/bidRules.js src/utils/bidRules.test.js src/components/LiveAuction.js
git commit -m "Enforce CPL 2026 per-player bid caps and warn on missing keeper"
```

---

## Verification checklist

Run after Task 9, against the live database.

- [ ] `npx react-scripts test --watchAll=false` — all tests pass.
- [ ] `npx react-scripts build` — compiles.
- [ ] `node scripts/create_pre_auction_template.js` — writes a 40-row workbook.
- [ ] Upload a filled template: all 8 teams show 5 players and 🪙 1000.
- [ ] Reload the page: squads persist (this is the fix from Task 4 — before it, squads vanished on reload).
- [ ] Upload a deliberately broken sheet (two Captains on one team): errors listed per team, nothing written.
- [ ] Reopen one team: its 5 return to the auction pool, the team shows as outstanding.
- [ ] Upload a registered-player list containing a pre-auction player: their team assignment survives.
- [ ] In the live auction, a 251-coin bid on a Batsman is rejected; 250 is accepted.
- [ ] A 151-coin bid on a Wicket Keeper is rejected.

## Notes for the implementer

- **Role strings are load-bearing.** `All-rounder` (lowercase r, hyphen) and `WicketKeeper` (one word) match the database CHECK constraint. A near-miss like `Allrounder` fails at the database, not in the UI.
- **`sold_to` holds a team NAME**, not a team ID, and has no foreign key. This looks wrong against `supabase/schema.sql`, which is stale — `sql/fix_foreign_key.sql` dropped the constraint deliberately.
- **`uploadExcelData` deletes every row before inserting.** Task 8 makes it spare pre-auction players. Do not run the player upload against the live database before Task 8 is merged.
- The admin password is `admin123`, hardcoded at `src/components/AdminPage.js:37`. Out of scope here, but do not print it in any commit message or log.
