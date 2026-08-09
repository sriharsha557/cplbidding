# CPL 2026 Homepage Redesign

## Delivery status

Complete. The public homepage has been rebuilt as a responsive, live auction dashboard for the Colruyt Premier League 2026 season.

## Updated files

- `src/components/HomePage.js` — redesigned public auction experience while preserving existing live data, player, team, progress, and leaderboard views.
- `src/index.css` — added the responsive CPL 2026 visual system and replaced the global teal page background.
- `public/index.html` — updated the page title, description, and browser theme colour for CPL 2026.

## Homepage experience

### Before the auction

- 2026 season introduction with a clear waiting status.
- Live counts for teams, players, and total token pool.
- Automatic transition to the live view once the auction starts.

### During the auction

- Match-day hero with live status and current time.
- Four key metrics: teams ready, players in the pool, players processed, and current auction stage.
- Player spotlight with photo, role, player ID, base price, and phase progress.
- Dedicated tabs for overview, teams, category progress, and leaderboard.

### After the auction

- Completion state with sold, unsold, and total-spent statistics.

## Design decisions

- Deep navy and mint establish a premium stadium-night atmosphere.
- Gold highlights the CPL season and key monetary values.
- Layouts collapse from four columns to two columns and then one column for narrow screens.
- Existing auction state and component integrations remain unchanged; the redesign is presentation-focused.

## 2026 update

All user-facing references under `src` and `public` have been checked for `2025` and updated or removed. The browser title is now **CPL 2026 Digital Auction**.

## Verification

`npm run build` completed successfully after the redesign.
