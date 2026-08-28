import React from 'react';
import Pools from './Pools';
import Schedule from './Schedule';
import TeamSquads from './TeamSquads';

/**
 * Everything the public page shows once the auction is done and the season is
 * ahead. All three sections render together; the header tabs are anchor jumps.
 */
const LeaguePhaseShowcase = () => (
  <div className="cpl-preauction cpl-league">
    <div id="cpl-section-squads"><TeamSquads /></div>
    <div id="cpl-section-pools"><Pools /></div>
    <div id="cpl-section-schedule"><Schedule /></div>
  </div>
);

export default LeaguePhaseShowcase;
