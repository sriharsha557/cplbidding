# CPL 2026 pre-auction public page — design

Date: 2026-08-19

## Problem

The public page at `HomePage.js` renders a hero plus a thin "waiting card" while
`auctionStarted` is false. That is the state every recipient of the CPL 2026
announcement mail lands on, and it carries almost no information: no teams, no
champion, no indication that the ownership call is open or that pre-auction
squads are partly locked.

## Scope

Add three sections to the `!auctionStarted` branch only. When the auction goes
live the existing board takes over and these disappear.

Out of scope: a standalone defending-champions banner (dropped in review; the
champion is marked inside the team grid instead), and any form input. Ownership
responses continue to arrive by mail.

## Data

New `src/config/teams2026.js`, following `src/config/cpl2026.js`:

- `TEAMS_2026` — 8 entries of `{ id, name, displayName, logo, isDefendingChampion }`
- `OWNERSHIP` — `{ confirmed: 4, total: 8, deadline: '2026-08-24' }`
- `PRE_AUCTION_STATUS` — `{ slotsLocked: 3, captainsSet: true, viceCaptainsSet: true }`

`name` is the canonical value that matches `teams.team_name` in Supabase.
`sold_to` is a foreign key onto that column (`sql/supabase-schema.sql`), so the
data name must not change. `displayName` exists purely for the page, which is
how DIGI TITANS is rendered while the row stays `Digititans`.

Auction rules are not duplicated here. `AuctionFormat` imports `CPL_2026` so the
published numbers cannot drift from what the bidding engine enforces.

## Components

`src/components/preauction/`:

| File | Responsibility |
| --- | --- |
| `TeamRoster.js` | 8-card grid: logo, display name, champion badge |
| `SeasonRoadmap.js` | Completed / active / upcoming milestones to 12 Sep |
| `AuctionFormat.js` | Budget, squad size, per-category max bids from `CPL_2026` |
| `PreAuctionShowcase.js` | Container composing the three |

Each takes props with config defaults, so all three render standalone and can be
tested without `HomePage`. `HomePage` gains one import and one element.

## Behaviour

- Logos resolve from `/public`. On error a card falls back to the team's
  initials, matching the `onError` handling on the hero trophy. A missing file
  must not leave a broken-image icon on a public page.
- The roadmap computes days remaining from `OWNERSHIP.deadline` at render. Once
  the deadline passes it reads "Ownership call closed" rather than counting
  negative days, because the config is static and will go stale.
- `confirmed` clamps to `total`, so a bad edit cannot render "9 of 8".

## Styling

Appended to `src/index.css` under a `cpl-preauction-*` prefix, reusing the
existing palette: gold `#f1c566` / `#b4791a`, teal `#173d49`, body `#65727a`,
borders `#dfdfd7`. No Tailwind — it is not a dependency, which is why
`PhaseStepper.js` currently renders unstyled and is not reused here.

Grid is responsive: 4 columns desktop, 2 tablet, 2 mobile.

## Verification

- Unit tests for the deadline and clamping logic
- `npm test` green, `npm run build` clean
- Every `logo` path confirmed against a real file in `public/`
