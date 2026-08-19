import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TEAMS_2026, DEFENDING_CHAMPION_SEASON } from '../../config/teams2026';

/** Initials fallback so a missing logo never shows a broken-image icon. */
const initials = name => name
  .replace(/[^A-Za-z& ]/g, '')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(word => word[0])
  .join('')
  .toUpperCase();

const TeamCard = ({ team, index }) => {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <motion.article
      className={`cpl-team-card${team.isDefendingChampion ? ' cpl-team-card--champion' : ''}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      {team.isDefendingChampion && (
        <span className="cpl-team-card__badge">🏆 {DEFENDING_CHAMPION_SEASON} Champions</span>
      )}
      <div className="cpl-team-card__crest">
        {logoFailed
          ? <span className="cpl-team-card__initials">{initials(team.name)}</span>
          : <img src={team.logo} alt="" loading="lazy" onError={() => setLogoFailed(true)} />}
      </div>
      <h3>{team.displayName}</h3>
    </motion.article>
  );
};

const TeamRoster = ({ teams = TEAMS_2026 }) => (
  <section className="cpl-panel cpl-preauction-panel" aria-labelledby="cpl-teams-heading">
    <div className="cpl-section-heading">
      <div>
        <p className="cpl-eyebrow">The line-up</p>
        <h2 id="cpl-teams-heading">Eight teams. One trophy.</h2>
      </div>
    </div>
    <div className="cpl-team-grid">
      {teams.map((team, index) => <TeamCard key={team.id} team={team} index={index} />)}
    </div>
  </section>
);

export default TeamRoster;
