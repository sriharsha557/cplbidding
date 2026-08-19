import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PreAuctionShowcase from './PreAuctionShowcase';
import SeasonRoadmap from './SeasonRoadmap';
import { TEAMS_2026 } from '../../config/teams2026';

const render = element => renderToStaticMarkup(element);

/** renderToStaticMarkup escapes entities, so "Hits & Misses" arrives as "Hits &amp; Misses". */
const escapeHtml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

describe('PreAuctionShowcase', () => {
  const html = render(<PreAuctionShowcase />);

  it('lists every team by display name', () => {
    TEAMS_2026.forEach(team => expect(html).toContain(escapeHtml(team.displayName)));
  });

  it('renders DIGI TITANS, not the stored Digititans spelling', () => {
    expect(html).toContain('DIGI TITANS');
    expect(html).not.toContain('>Digititans<');
  });

  it('badges the defending champion', () => {
    expect(html).toContain('2025 Champions');
    expect(html.match(/cpl-team-card__badge/g)).toHaveLength(1);
  });

  it('points every crest at a logo file', () => {
    TEAMS_2026.forEach(team => expect(html).toContain(`src="${team.logo}"`));
  });

  it('shows the auction rules taken from CPL_2026', () => {
    expect(html).toContain('1,000');
    expect(html).toContain('All-rounder');
    expect(html).toContain('350');
  });
});

describe('SeasonRoadmap deadline copy', () => {
  const at = date => render(<SeasonRoadmap today={date} />);

  it('counts down before the deadline', () => {
    expect(at(new Date(2026, 7, 19))).toContain('5 days left');
  });

  it('says closes today on the day', () => {
    expect(at(new Date(2026, 7, 24))).toContain('Closes today');
  });

  it('says closed rather than negative days once past', () => {
    const html = at(new Date(2026, 8, 1));
    expect(html).toContain('Ownership call closed');
    expect(html).not.toMatch(/-\d+ days/);
  });

  it('reports the confirmed count', () => {
    expect(at(new Date(2026, 7, 19))).toContain('4 of 8');
  });
});
