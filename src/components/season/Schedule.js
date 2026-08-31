import React from 'react';
import { SCHEDULE_BY_DATE, scheduleTeam } from '../../config/schedule2026';

const matchup = (m) => {
  const a = scheduleTeam(m.teamA);
  const b = scheduleTeam(m.teamB);
  if (a && b) return `${a.displayName} v ${b.displayName}`;
  if (m.note) return m.note;
  return 'To be confirmed';
};

/** One row per match, in the DAY / MATCH / TIME / OVERS shape of the grid. */
const MatchTable = ({ matches }) => (
  <table className="cpl-schedule__table">
    <thead>
      <tr><th>Match</th><th>Teams</th><th>Time</th><th>Overs</th></tr>
    </thead>
    <tbody>
      {matches.map(m => (
        <tr key={m.matchNo}>
          <td>{m.label || `Match ${m.matchNo}`}</td>
          <td>{matchup(m)}</td>
          <td>{m.time}</td>
          <td>{m.overs}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

/** The full published match schedule: league Saturdays, then the knockouts. */
const Schedule = ({ days = SCHEDULE_BY_DATE }) => (
  <section className="cpl-panel cpl-preauction-panel" aria-labelledby="cpl-schedule-heading">
    <div className="cpl-section-heading">
      <div>
        <p className="cpl-eyebrow">Fixtures</p>
        <h2 id="cpl-schedule-heading">Match schedule</h2>
      </div>
    </div>

    <div className="cpl-schedule">
      {days.map(day => (
        <article className="cpl-schedule__day" key={day.date}>
          <header className="cpl-schedule__day-head">
            <strong>{day.label}{day.tentative ? ' · date TBC' : ''}</strong>
            <span>
              {day.stage}
              {day.venue && (
                <> · {day.venueUrl
                  ? <a href={day.venueUrl} target="_blank" rel="noreferrer">{day.venue}</a>
                  : day.venue}</>
              )}
            </span>
          </header>

          {day.venueNote && <p className="cpl-schedule__note">{day.venueNote}</p>}

          {day.pools
            ? day.pools.map(({ pool, matches }) => (
                <div className="cpl-schedule__pool" key={pool}>
                  <h4>{pool}</h4>
                  <MatchTable matches={matches} />
                </div>
              ))
            : <MatchTable matches={day.matches} />}
        </article>
      ))}
    </div>
  </section>
);

export default Schedule;
