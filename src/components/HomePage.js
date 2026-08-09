import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getCurrentAuctionPhase, ROLE_EMOJIS } from '../utils/auctionUtils';
import TeamDashboard from './TeamDashboard';
import CategoryProgress from './CategoryProgress';
import AuctionProgress from './AuctionProgress';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'teams', label: 'Teams' },
  { id: 'progress', label: 'Progress' },
  { id: 'leaderboard', label: 'Leaderboard' }
];

const Stat = ({ value, label, accent = 'gold' }) => (
  <div className="cpl-stat">
    <strong className={`cpl-stat__value cpl-stat__value--${accent}`}>{value}</strong>
    <span>{label}</span>
  </div>
);

const SectionHeading = ({ eyebrow, title, children }) => (
  <div className="cpl-section-heading">
    <div>
      {eyebrow && <p className="cpl-eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
    </div>
    {children}
  </div>
);

function HomePage({ auctionState }) {
  const [activeView, setActiveView] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const {
    auctionStarted,
    currentPlayerIdx,
    players = [],
    teams = {},
    auctionHistory = [],
    unsoldPlayers = [],
    maxTokens = 1200
  } = auctionState;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentPlayer = auctionStarted && currentPlayerIdx < players.length
    ? players[currentPlayerIdx]
    : null;
  const currentPhase = currentPlayer ? getCurrentAuctionPhase(players, currentPlayerIdx) : null;
  const isComplete = auctionStarted && currentPlayerIdx >= players.length;
  const totalSold = auctionHistory.length;
  const totalUnsold = unsoldPlayers.length;
  const totalProcessed = totalSold + totalUnsold;
  const totalSpent = auctionHistory.reduce((sum, player) => sum + (Number(player.SoldPrice) || 0), 0);
  const teamStats = useMemo(() => Object.entries(teams).map(([name, team]) => {
    const squad = team.squad || [];
    const tokenLimit = team.maxTokens || maxTokens;
    const spent = tokenLimit - (team.tokensLeft ?? tokenLimit);
    return {
      name,
      players: squad.length,
      tokensLeft: team.tokensLeft ?? tokenLimit,
      tokensSpent: spent,
      avgPrice: squad.length ? Math.round(spent / squad.length) : 0
    };
  }).sort((a, b) => b.tokensSpent - a.tokensSpent), [teams, maxTokens]);

  return (
    <main className="cpl-home">
      <section className="cpl-hero">
        <div className="cpl-hero__glow cpl-hero__glow--one" />
        <div className="cpl-hero__glow cpl-hero__glow--two" />
        <div className="cpl-container cpl-hero__content">
          <div className="cpl-hero__topline">
            <span>Colruyt Group presents</span>
            <span className="cpl-season">Season 2026</span>
          </div>
          <div className="cpl-title-row">
            <div>
              <p className="cpl-eyebrow">Colruyt Premier League</p>
              <h1>{auctionStarted ? 'Live Auction' : 'Auction Centre'}</h1>
              <p className="cpl-hero__description">
                {auctionStarted
                  ? 'Every bid. Every squad. Live as it happens.'
                  : 'The squad-building room for the 2026 season.'}
              </p>
            </div>
            <div className={`cpl-live-pill ${auctionStarted ? '' : 'cpl-live-pill--waiting'}`}>
              <i />
              {auctionStarted ? 'Live updates' : 'Awaiting auction start'}
            </div>
          </div>

          <div className="cpl-scoreboard">
            <Stat value={Object.keys(teams).length} label="Teams ready" accent="mint" />
            <Stat value={players.length} label="Players in pool" />
            <Stat value={auctionStarted ? `${totalProcessed}/${players.length}` : `${(maxTokens * Object.keys(teams).length).toLocaleString()}`} label={auctionStarted ? 'Players processed' : 'Total tokens'} accent="coral" />
            <Stat value={isComplete ? 'Complete' : currentPhase ? `Phase ${currentPhase.phase}/4` : 'On deck'} label={isComplete ? 'Auction status' : 'Current stage'} accent="lavender" />
          </div>
        </div>
      </section>

      <section className="cpl-content cpl-container">
        {auctionStarted && (
          <nav className="cpl-tabs" aria-label="Auction views">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveView(tab.id)} className={activeView === tab.id ? 'is-active' : ''}>
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={auctionStarted ? activeView : 'waiting'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {!auctionStarted && (
              <section className="cpl-waiting-card">
                <div className="cpl-waiting-card__marker">2026</div>
                <div>
                  <p className="cpl-eyebrow">Match day is loading</p>
                  <h2>Everything is in place.</h2>
                  <p>When the first player goes under the hammer, this page will switch to the live auction automatically.</p>
                </div>
                <div className="cpl-waiting-card__meta">Public viewing page<br />Refreshes automatically</div>
              </section>
            )}

            {auctionStarted && activeView === 'overview' && (
              <>
                {isComplete ? (
                  <section className="cpl-complete-card">
                    <p className="cpl-eyebrow">Final whistle</p>
                    <h2>Auction complete</h2>
                    <p>All {totalProcessed} players have been processed for the 2026 season.</p>
                    <div className="cpl-complete-card__stats">
                      <Stat value={totalSold} label="Players sold" accent="mint" />
                      <Stat value={totalUnsold} label="Unsold" accent="coral" />
                      <Stat value={totalSpent.toLocaleString()} label="Tokens spent" />
                    </div>
                  </section>
                ) : currentPlayer ? (
                  <section className="cpl-player-card">
                    <div className="cpl-player-card__image-wrap">
                      <img src={currentPlayer.PhotoFileName ? `/players/${currentPlayer.PhotoFileName}` : '/placeholder-player.svg'} alt={currentPlayer.Name} onError={event => { event.currentTarget.src = '/placeholder-player.svg'; }} />
                    </div>
                    <div className="cpl-player-card__body">
                      <p className="cpl-eyebrow">Now on auction</p>
                      <h2>{currentPlayer.Name}</h2>
                      <p className="cpl-player-card__role">{ROLE_EMOJIS[currentPlayer.Role]} {currentPlayer.Role} <span>•</span> Player {currentPlayer.PlayerID}</p>
                      <div className="cpl-price"><span>Base price</span><strong>{currentPlayer.BaseTokens} <small>tokens</small></strong></div>
                      {currentPhase && <div className="cpl-phase"><div><span>{currentPhase.phaseName}</span><span>{currentPhase.categoryProgress.current}/{currentPhase.categoryProgress.total}</span></div><div className="cpl-progress"><i style={{ width: `${currentPhase.categoryProgress.percentage}%` }} /></div></div>}
                    </div>
                    <div className="cpl-player-card__status"><i /> Bidding in progress</div>
                  </section>
                ) : (
                  <section className="cpl-empty"><h2>Preparing the next player</h2><p>The live board will update shortly.</p></section>
                )}
              </>
            )}

            {auctionStarted && activeView === 'teams' && <section className="cpl-panel"><SectionHeading eyebrow="Squad tracker" title="Team status" /><TeamDashboard teams={teams} /></section>}
            {auctionStarted && activeView === 'progress' && <section className="cpl-panel"><SectionHeading eyebrow="Auction tracker" title="Category progress" /><CategoryProgress players={players} currentPlayerIdx={currentPlayerIdx} teams={teams} auctionHistory={auctionHistory} /><div className="cpl-panel__spacer"><AuctionProgress players={players} currentPlayerIdx={currentPlayerIdx} auctionHistory={auctionHistory} unsoldPlayers={unsoldPlayers} isComplete={isComplete} /></div></section>}
            {auctionStarted && activeView === 'leaderboard' && <section className="cpl-panel"><SectionHeading eyebrow="Biggest moves" title="Leaderboard" /><div className="cpl-leaderboard">{teamStats.length ? teamStats.map((team, index) => <div className="cpl-leaderboard__row" key={team.name}><span className="cpl-leaderboard__rank">{String(index + 1).padStart(2, '0')}</span><div><strong>{team.name}</strong><small>{team.players} players · Avg. {team.avgPrice} tokens</small></div><div><strong>{team.tokensSpent.toLocaleString()}</strong><small>tokens spent</small></div><div><strong>{team.tokensLeft.toLocaleString()}</strong><small>remaining</small></div></div>) : <div className="cpl-empty"><h2>No team data yet</h2><p>The leaderboard will populate when team data is available.</p></div>}</div></section>}
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="cpl-footer"><div className="cpl-container"><span>Colruyt Premier League</span><span>2026 season</span><span>{auctionStarted ? `Updated ${currentTime.toLocaleTimeString()}` : 'Live updates enabled'}</span></div></footer>
    </main>
  );
}

export default HomePage;
