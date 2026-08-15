import React from 'react';

import { CPL_2026 } from '../config/cpl2026';

/**
 * Typographic CPL lockup, used in place of public/cpl.png.
 *
 * That file is a 2025 asset, and its wordmark is near-black — illegible on the
 * dark admin background. Rendering the lockup as text fixes both: the season
 * comes from config so it cannot go stale, and the colours adapt to the surface
 * it sits on.
 *
 * `tone` describes the BACKGROUND, not the text: use 'dark' on a dark surface.
 */
const TONES = {
  dark: '#f8fbf8',
  light: '#1B2A22'
};

const SIZES = {
  sm: { season: 15, word: 12, gap: 7 },
  lg: { season: 40, word: 21, gap: 12 }
};

const GOLD = '#f1c566';

const CplWordmark = ({ size = 'lg', tone = 'dark' }) => {
  const { season, word, gap } = SIZES[size] || SIZES.lg;
  const ink = TONES[tone] || TONES.dark;
  const year = new Date(CPL_2026.tournament.start).getFullYear();

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'baseline', gap, lineHeight: 1 }}
      aria-label={`Colruyt Premier League ${year}`}
    >
      <span style={{ fontFamily: 'Georgia, serif', fontSize: season, fontWeight: 700, color: GOLD, letterSpacing: '-.03em' }}>
        {year}
      </span>
      <span style={{ fontFamily: 'Georgia, serif', fontSize: word, color: ink, letterSpacing: '.02em' }}>
        Colruyt <span style={{ color: GOLD }}>Premier</span> League
      </span>
    </span>
  );
};

export default CplWordmark;
