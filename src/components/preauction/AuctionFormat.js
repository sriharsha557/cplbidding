import React from 'react';
import { CPL_2026 } from '../../config/cpl2026';
import { AUCTION_POOL_SIZE } from '../../config/teams2026';

/**
 * Reads CPL_2026 directly rather than restating the numbers, so what the public
 * page publishes and what the bidding engine enforces cannot drift apart.
 */
const AuctionFormat = ({ rules = CPL_2026, poolSize = AUCTION_POOL_SIZE }) => {
  const auctionSlots = rules.defaultSquadSize - rules.preAuctionSlots.total;

  // "free" previously meant "costs no coins" but read as "vacant", and "won at
  // the auction" described an event that has not happened yet. Both now say
  // plainly what is already settled and what is still to play for.
  const headline = [
    { value: poolSize, label: 'Players up for auction' },
    { value: rules.auctionBudget.toLocaleString(), label: 'Coins per team' },
    { value: rules.defaultSquadSize, label: 'Squad size' },
    { value: rules.preAuctionSlots.total, label: 'Already signed, no coins spent' },
    { value: auctionSlots, label: 'Places still to fill' }
  ];

  return (
    <section className="cpl-panel cpl-preauction-panel" aria-labelledby="cpl-format-heading">
      <div className="cpl-section-heading">
        <div>
          <p className="cpl-eyebrow">The format</p>
          <h2 id="cpl-format-heading">How the auction works</h2>
        </div>
      </div>

      <p className="cpl-format__intro">
        {poolSize} players have registered for the auction. Every team starts with the full{' '}
        {rules.auctionBudget.toLocaleString()} coins: the {rules.preAuctionSlots.total} pre-auction players — Captain,
        Vice-Captain and {rules.preAuctionSlots.retainedOrTraded} retained or traded — cost nothing, so bidding begins
        at each team's sixth player.
      </p>

      <div className="cpl-format__stats">
        {headline.map(item => (
          <div className="cpl-format__stat" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="cpl-format__bids">
        <p className="cpl-eyebrow">Maximum bid by role</p>
        <ul>
          {Object.entries(rules.maxBidByCategory).map(([role, max]) => (
            <li key={role}><span>{role}</span><strong>{max}</strong></li>
          ))}
        </ul>
        <small>Every squad must include at least {rules.minWicketKeepers} wicket-keeper.</small>
      </div>
    </section>
  );
};

export default AuctionFormat;
