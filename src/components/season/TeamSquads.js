import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAMS_2026 } from '../../config/teams2026';
import { SQUADS_2026 } from '../../config/squads2026';
import { poolOf } from '../../config/pools2026';
import TeamCrest from './TeamCrest';

const ROLE_EMOJIS = { Batsman: '🏏', Bowler: '🎯', WicketKeeper: '🧤', 'All-rounder': '⚡' };
const roleBadge = (p) => (p.preAuctionRole === 'Captain' ? 'C' : p.preAuctionRole === 'ViceCaptain' ? 'VC' : null);

const PlayerRow = ({ player }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const badge = roleBadge(player);
  return (
    <li className="cpl-squad__player">
      <span className="cpl-squad__avatar">
        {imgFailed || !player.photo
          ? <span aria-hidden="true">{ROLE_EMOJIS[player.role] || '•'}</span>
          : <img src={`/players/${player.photo}`} alt="" loading="lazy" onError={() => setImgFailed(true)} />}
      </span>
      <span className="cpl-squad__name">
        {player.name}
        {badge && <b className="cpl-squad__lead">{badge}</b>}
      </span>
      <span className="cpl-squad__role">{ROLE_EMOJIS[player.role]} {player.role}</span>
      <span className="cpl-squad__price">
        {player.price != null ? `🪙 ${player.price}` : 'Retained'}
      </span>
    </li>
  );
};

const SquadCard = ({ team, squad, open, onToggle }) => {
  const players = [...(squad?.retained || []), ...(squad?.bought || [])];
  const pool = poolOf(team.id);
  return (
    <article className={`cpl-squad-card${open ? ' is-open' : ''}`}>
      <button className="cpl-squad-card__head" onClick={onToggle} aria-expanded={open}>
        <TeamCrest team={team} className="cpl-squad-card__crest" />
        <div>
          <strong>{team.displayName}</strong>
          <small>{pool ? `${pool} · ` : ''}{players.length} players · 🪙 {squad?.spent ?? 0} spent</small>
        </div>
        <span className="cpl-squad-card__chevron" aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            className="cpl-squad__list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {players.map(p => <PlayerRow key={p.playerId} player={p} />)}
          </motion.ul>
        )}
      </AnimatePresence>
    </article>
  );
};

/** All eight final squads, each card expands to its 14 players. */
const TeamSquads = ({ teams = TEAMS_2026, squads = SQUADS_2026 }) => {
  const [openId, setOpenId] = useState(null);
  return (
    <section className="cpl-panel cpl-preauction-panel" aria-labelledby="cpl-squads-heading">
      <div className="cpl-section-heading">
        <div>
          <p className="cpl-eyebrow">The squads</p>
          <h2 id="cpl-squads-heading">Every team, every player</h2>
        </div>
      </div>
      <div className="cpl-squad-grid">
        {teams.map(team => (
          <SquadCard
            key={team.id}
            team={team}
            squad={squads[team.id]}
            open={openId === team.id}
            onToggle={() => setOpenId(openId === team.id ? null : team.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default TeamSquads;
