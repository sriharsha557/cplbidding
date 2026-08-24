import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HomePage from './HomePage';
import { CPL_2026 } from '../config/cpl2026';
import { TEAMS_2026, AUCTION_POOL_SIZE } from '../config/teams2026';

const heroStats = html => {
  const block = html.split('cpl-scoreboard')[1] || '';
  return block.split('cpl-content')[0];
};

describe('hero stats with an empty database', () => {
  // Supabase resolves with empty collections before the pre-auction upload.
  const html = renderToStaticMarkup(<HomePage auctionState={{ auctionStarted: false, currentPlayerIdx: 0, players: [], teams: {} }} />);
  const stats = heroStats(html);

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

describe('hero stats with real data', () => {
  const auctionState = {
    auctionStarted: false,
    currentPlayerIdx: 0,
    players: [{ PlayerID: 'A1' }, { PlayerID: 'A2' }],
    teams: { Mavericks: { squad: [] }, Pirates: { squad: [] } },
    maxTokens: 1000
  };
  const stats = heroStats(renderToStaticMarkup(<HomePage auctionState={auctionState} />));

  it('prefers live counts over the config fallback', () => {
    expect(stats).toContain('>2<');
    expect(stats).not.toContain(`>${AUCTION_POOL_SIZE}<`);
    expect(stats).not.toContain(`>${TEAMS_2026.length}<`);
  });
});
