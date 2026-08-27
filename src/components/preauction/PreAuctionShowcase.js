import React from 'react';
import LiveNotice from './LiveNotice';
import TeamRoster from './TeamRoster';
import SeasonRoadmap from './SeasonRoadmap';
import AuctionFormat from './AuctionFormat';

/** Everything the public page shows while the auction has not started. */
const PreAuctionShowcase = () => (
  <div className="cpl-preauction">
    <LiveNotice />
    <TeamRoster />
    <SeasonRoadmap />
    <AuctionFormat />
  </div>
);

export default PreAuctionShowcase;
