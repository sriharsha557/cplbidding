import React, { useState } from 'react';

/** Initials fallback so a missing logo never shows a broken-image icon. */
export const initials = name => String(name)
  .replace(/[^A-Za-z& ]/g, '')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(word => word[0])
  .join('')
  .toUpperCase();

/** Team logo with a graceful initials fallback. Shared by the league-phase views. */
const TeamCrest = ({ team, className = 'cpl-team-card__crest' }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className={className}>
      {failed || !team.logo
        ? <span className="cpl-team-card__initials">{initials(team.displayName || team.name)}</span>
        : <img src={team.logo} alt="" loading="lazy" onError={() => setFailed(true)} />}
    </div>
  );
};

export default TeamCrest;
