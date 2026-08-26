import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * The card renders the registration comment only when there is one, so a player
 * who left the field blank gets no empty bubble.
 */
const Note = ({ player }) => (
  <div>
    {player.Comments && <p className="player-card__note">💬 {player.Comments}</p>}
  </div>
);

it('shows the comment when present', () => {
  const html = renderToStaticMarkup(<Note player={{ Comments: 'Middle order batsman, Finisher' }} />);
  expect(html).toContain('Middle order batsman, Finisher');
  expect(html).toContain('player-card__note');
});

it('renders nothing when the comment is empty', () => {
  expect(renderToStaticMarkup(<Note player={{ Comments: '' }} />)).not.toContain('player-card__note');
});

it('renders nothing when the field is absent', () => {
  expect(renderToStaticMarkup(<Note player={{}} />)).not.toContain('player-card__note');
});
