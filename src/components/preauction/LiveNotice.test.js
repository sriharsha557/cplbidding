import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LiveNotice from './LiveNotice';
import { AUCTION_LIVE } from '../../config/teams2026';

const render = (a, today = new Date(2026, 7, 27)) =>
  renderToStaticMarkup(<LiveNotice announcement={a} today={today} />);

it('announces time, venue and note', () => {
  const html = render(AUCTION_LIVE);
  expect(html).toContain('5:30 PM');
  expect(html).toContain('IST');
  expect(html).toContain('5th floor canteen');
  expect(html).toContain('stay on this page for live updates');
});

it('says "today" on the day of the auction', () => {
  expect(render(AUCTION_LIVE, new Date(2026, 7, 27))).toContain('Auction goes live today at 5:30 PM IST');
});

it('names the day if someone opens the page later', () => {
  const html = render(AUCTION_LIVE, new Date(2026, 7, 25));
  expect(html).toContain('Thursday');
  expect(html).not.toContain('goes live today');
});

it('omits the day when no date is configured', () => {
  expect(render({ ...AUCTION_LIVE, date: null })).toContain('Auction goes live at 5:30 PM IST');
});

it('falls back to no day if the date is unparseable', () => {
  expect(render({ ...AUCTION_LIVE, date: 'soon' })).toContain('Auction goes live at 5:30 PM IST');
});
