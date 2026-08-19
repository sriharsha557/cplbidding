import React from 'react';
import { motion } from 'framer-motion';
import { CPL_2026 } from '../../config/cpl2026';
import { OWNERSHIP, PRE_AUCTION_STATUS, daysUntilDeadline, ownershipProgress } from '../../config/teams2026';

const formatDate = iso => {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

/**
 * Deadline copy. The config is edited by hand and will go stale, so once the
 * date passes this says "closed" rather than counting negative days.
 */
const deadlineNote = days => {
  if (days === null) return null;
  if (days < 0) return 'Ownership call closed';
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `${days} days left`;
};

const SeasonRoadmap = ({ ownership = OWNERSHIP, status = PRE_AUCTION_STATUS, today = new Date() }) => {
  const { confirmed, total, isComplete } = ownershipProgress(ownership);
  const days = daysUntilDeadline(ownership.deadline, today);
  const note = deadlineNote(days);
  const percent = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  const steps = [
    { id: 'registration', label: 'Registrations in', detail: 'Player pool collected', state: 'done' },
    { id: 'leaders', label: 'Captains & Vice-Captains', detail: status.captainsSet && status.viceCaptainsSet ? 'Set for all 8 teams' : 'In progress', state: status.captainsSet && status.viceCaptainsSet ? 'done' : 'active' },
    { id: 'preauction', label: 'Pre-auction slots', detail: `${status.slotsLocked} per team locked via retention & trading`, state: 'done' },
    { id: 'ownership', label: 'Ownership call', detail: `${confirmed} of ${total} owners confirmed`, state: isComplete ? 'done' : 'active' },
    { id: 'auction', label: 'The auction', detail: `Teams bid for the remaining ${CPL_2026.defaultSquadSize - CPL_2026.preAuctionSlots.total} squad places`, state: 'next' },
    { id: 'season', label: 'Season starts', detail: formatDate(CPL_2026.tournament.start), state: 'next' }
  ];

  return (
    <section className="cpl-panel cpl-preauction-panel" aria-labelledby="cpl-roadmap-heading">
      <div className="cpl-section-heading">
        <div>
          <p className="cpl-eyebrow">Where we are</p>
          <h2 id="cpl-roadmap-heading">Road to the auction</h2>
        </div>
        {note && <span className={`cpl-deadline-pill${days !== null && days < 0 ? ' cpl-deadline-pill--closed' : ''}`}>{note}</span>}
      </div>

      <div className="cpl-ownership-bar">
        <div className="cpl-ownership-bar__meta">
          <strong>Ownership confirmations</strong>
          <span>{confirmed} of {total} · closes {formatDate(ownership.deadline)}</span>
        </div>
        <div className="cpl-ownership-bar__track" role="progressbar" aria-valuenow={confirmed} aria-valuemin={0} aria-valuemax={total} aria-label="Owners confirmed">
          <motion.i initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
        </div>
      </div>

      <ol className="cpl-roadmap">
        {steps.map((step, index) => (
          <motion.li
            key={step.id}
            className={`cpl-roadmap__step cpl-roadmap__step--${step.state}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
          >
            <span className="cpl-roadmap__marker" aria-hidden="true">{step.state === 'done' ? '✓' : index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
};

export default SeasonRoadmap;
