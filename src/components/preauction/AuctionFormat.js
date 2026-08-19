import React from 'react';
import { CPL_2026 } from '../../config/cpl2026';

/**
 * Reads CPL_2026 directly rather than restating the numbers, so what the public
 * page publishes and what the bidding engine enforces cannot drift apart.
 */
const AuctionFormat = ({ rules = CPL_2026 }) => {
  const auctionSlots = rules.defaultSquadSize - rules.preAuctionSlots.total;

  const headline = [
    { value: rules.auctionBudget.toLocaleString(), label: 'Coins per team' },
    { value: rules.defaultSquadSize, label: 'Players per squad' },
    { value: rules.preAuctionSlots.total, label: 'Pre-auction slots (free)' },
    { value: auctionSlots, label: 'Won at the auction' }
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
        Every team starts with the full {rules.auctionBudget.toLocaleString()} coins. The {rules.preAuctionSlots.total} pre-auction
        players — Captain, Vice-Captain and {rules.preAuctionSlots.retainedOrTraded} retained or traded — cost nothing,
        so bidding begins at each team's sixth player.
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
