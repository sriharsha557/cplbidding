import React from 'react';
import { motion } from 'framer-motion';
import { AUCTION_LIVE } from '../../config/teams2026';

/** "today" on the day itself, otherwise the weekday and date. */
const formatDay = (iso, today) => {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const sameDay = date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
  return sameDay
    ? 'today'
    : `on ${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`;
};

/** Announces when bidding starts, above everything else on the pre-auction page. */
const LiveNotice = ({ announcement = AUCTION_LIVE, today = new Date() }) => {
  const { time, timezone, date, venue, note } = announcement;
  const day = date ? formatDay(date, today) : null;

  return (
    <motion.section
      className="cpl-live-notice"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-live="polite"
    >
      <span className="cpl-live-notice__pulse" aria-hidden="true" />
      <div>
        <strong>
          Auction goes live{day ? ` ${day}` : ''} at {time} {timezone}
          {venue && <> · {venue}</>}
        </strong>
        {note && <span>{note}</span>}
      </div>
    </motion.section>
  );
};

export default LiveNotice;
