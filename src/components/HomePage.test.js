import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HomePage from './HomePage';
import { CPL_2026 } from '../config/cpl2026';
import { TEAMS_2026, AUCTION_POOL_SIZE } from '../config/teams2026';
import { TOTAL_MATCHES } from '../config/schedule2026';

const heroStats = html => {
  const block = html.split('cpl-scoreboard')[1] || '';
  return block.split('cpl-content')[0];
};
const render = (props) => renderToStaticMarkup(<HomePage {...props} />);

describe('pre-auction hero, empty database', () => {
  // Supabase resolves with empty collections before the pre-auction upload.
  const stats = heroStats(render({ phase: 'preauction', auctionState: { auctionStarted: false, currentPlayerIdx: 0, players: [], teams: {} } }));

  it('never headlines zero teams', () => {
    expect(stats).toContain(`>${TEAMS_2026.length}<`);
    expect(stats).not.toMatch(/>0</);
  });

  it('falls back to the registered pool size', () => {
    expect(stats).toContain(`>${AUCTION_POOL_SIZE}<`);
  });

  it('totals tokens at the 2026 budget, not the stale 1200 default', () => {
    expect(stats).toContain((CPL_2026.auctionBudget * TEAMS_2026.length).toLocaleString());
    expect(stats).not.toContain('9,600');
  });
});

describe('pre-auction hero with real data', () => {
  const auctionState = {
    auctionStarted: false,
    currentPlayerIdx: 0,
    players: [{ PlayerID: 'A1' }, { PlayerID: 'A2' }],
    teams: { Mavericks: { squad: [] }, Pirates: { squad: [] } },
    maxTokens: 1000
  };
  const stats = heroStats(render({ phase: 'preauction', auctionState }));

  it('prefers live counts over the config fallback', () => {
    expect(stats).toContain('>2<');
    expect(stats).not.toContain(`>${AUCTION_POOL_SIZE}<`);
  });
});

describe('league phase', () => {
  const html = render({ phase: 'league', auctionState: { auctionStarted: true, currentPlayerIdx: 0, players: [], teams: {} } });

  it('headlines teams, pools and the match count', () => {
    const stats = heroStats(html);
    expect(stats).toContain(`>${TEAMS_2026.length}<`);
    expect(stats).toContain(`>${TOTAL_MATCHES}<`);
  });

  it('shows the season tabs, not the auction tabs', () => {
    expect(html).toContain('>Squads<');
    expect(html).toContain('>Pools<');
    expect(html).toContain('>Schedule<');
    expect(html).not.toContain('>Leaderboard<');
  });

  it('renders the pools and schedule sections', () => {
    expect(html).toContain('Pool A');
    expect(html).toContain('Pool B');
    expect(html).toContain('Match schedule');
  });
});
