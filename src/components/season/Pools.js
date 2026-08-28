import React from 'react';
import { motion } from 'framer-motion';
import { POOLS_2026, POOLS_PROVISIONAL, poolTeams } from '../../config/pools2026';
import { DEFENDING_CHAMPION_SEASON } from '../../config/teams2026';
import TeamCrest from './TeamCrest';

/** The two league pools, four teams each. */
const Pools = ({ pools = POOLS_2026, provisional = POOLS_PROVISIONAL }) => (
  <section className="cpl-panel cpl-preauction-panel" aria-labelledby="cpl-pools-heading">
    <div className="cpl-section-heading">
      <div>
        <p className="cpl-eyebrow">The draw</p>
        <h2 id="cpl-pools-heading">Two pools</h2>
      </div>
      {provisional && <span className="cpl-deadline-pill">Draw to be confirmed</span>}
    </div>

    <div className="cpl-pool-grid">
      {Object.keys(pools).map((poolName, poolIndex) => (
        <div className="cpl-pool" key={poolName}>
          <h3 className="cpl-pool__name">{poolName}</h3>
          <ul className="cpl-pool__teams">
            {poolTeams(poolName).map((team, index) => (
              <motion.li
                key={team.id}
                className="cpl-pool__team"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: (poolIndex * 4 + index) * 0.04 }}
              >
                <TeamCrest team={team} className="cpl-pool__crest" />
                <div>
                  <strong>{team.displayName}</strong>
                  {team.owner && <small>{team.owner}</small>}
                </div>
                {team.isDefendingChampion && (
                  <span className="cpl-pool__badge">🏆 {DEFENDING_CHAMPION_SEASON}</span>
                )}
              </motion.li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

export default Pools;
