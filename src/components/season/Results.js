import React from 'react';
import { RESULTS_2026, CRICHEROES_URL } from '../../config/results2026';
import { SCHEDULE_2026, scheduleTeam } from '../../config/schedule2026';
import TeamCrest from './TeamCrest';

const formatDate = iso => {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const ScoreRow = ({ line, winner }) => {
  const team = scheduleTeam(line.teamId);
  if (!team) return null;
  return (
    <li className={line.teamId === winner ? 'is-winner' : ''}>
      <TeamCrest team={team} className="cpl-result-card__crest" />
      <span className="cpl-result-card__team">{team.displayName}</span>
      <span className="cpl-result-card__score">
        {line.score} <small>({line.overs} ov)</small>
      </span>
    </li>
  );
};

const ResultCard = ({ result }) => {
  const match = SCHEDULE_2026.find(m => m.matchNo === result.matchNo);
  if (!match) return null;

  return (
    <article className="cpl-result-card">
      <div className="cpl-result-card__head">
        <span className="cpl-result-card__badge">Result</span>
        <span className="cpl-result-card__meta">
          {match.label || `Match ${match.matchNo}`} · {match.pool ? `${match.pool} · ` : ''}
          {formatDate(match.date)} · {match.venue}
        </span>
      </div>
      <ul className="cpl-result-card__scores">
        {result.scores.map(line => <ScoreRow key={line.teamId} line={line} winner={result.winner} />)}
      </ul>
      <p className="cpl-result-card__result">{result.result}</p>
    </article>
  );
};

/** Recent match results, with a pointer to CricHeroes for live scoring and what's next. */
const Results = ({ results = RESULTS_2026 }) => (
  <section className="cpl-panel cpl-preauction-panel" aria-labelledby="cpl-results-heading">
    <div className="cpl-section-heading">
      <div>
        <p className="cpl-eyebrow">Match centre</p>
        <h2 id="cpl-results-heading">Results</h2>
      </div>
      <a className="cpl-results-link" href={CRICHEROES_URL} target="_blank" rel="noreferrer">
        Live scores & fixtures ↗
      </a>
    </div>

    {results.length ? (
      <div className="cpl-result-grid">
        {results.map(r => <ResultCard key={r.matchNo} result={r} />)}
      </div>
    ) : (
      <div className="cpl-empty"><h2>No results yet</h2><p>Scores land here once the first match is played.</p></div>
    )}

    <p className="cpl-results-note">
      For post-match updates and upcoming matches, follow the tournament on{' '}
      <a href={CRICHEROES_URL} target="_blank" rel="noreferrer">CricHeroes</a>.
    </p>
  </section>
);

export default Results;
