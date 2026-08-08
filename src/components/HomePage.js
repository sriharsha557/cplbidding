import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentAuctionPhase, ROLE_EMOJIS } from '../utils/auctionUtils';
import TeamDashboard from './TeamDashboard';
import CategoryProgress from './CategoryProgress';
import AuctionProgress from './AuctionProgress';

/* ── Floodlight Day CSS variables injected once ── */
const THEME = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
  :root {
    --fl-bg: #F4F1E6;
    --fl-bg-top: #FBF9F1;
    --fl-surface: #FFFFFF;
    --fl-surface-2: #F8F5EA;
    --fl-line: rgba(27,42,34,0.10);
    --fl-line-strong: rgba(27,42,34,0.20);
    --fl-gold: #A9770F;
    --fl-gold-fill: #C9911A;
    --fl-teal: #0F6E56;
    --fl-amber: #B04A0E;
    --fl-red: #B4302F;
    --fl-purple: #5B4A9C;
    --fl-ink: #1B2A22;
    --fl-ink-dim: #4E6156;
    --fl-ink-faint: #8C978E;
  }
  .fl-mono { font-family: 'IBM Plex Mono', monospace; }
  .fl-anton { font-family: 'Anton', sans-serif; }
  .fl-sans { font-family: 'IBM Plex Sans', sans-serif; }
`;

function injectTheme() {
  if (!document.getElementById('fl-theme')) {
    const s = document.createElement('style');
    s.id = 'fl-theme';
    s.textContent = THEME;
    document.head.appendChild(s);
  }
}

/* ── Small reusable pieces ── */
const LiveDot = () => (
  <span style={{
    display:'inline-block', width:7, height:7, borderRadius:'50%',
    background:'var(--fl-red)', boxShadow:'0 0 0 4px rgba(180,48,47,0.14)',
    flexShrink:0
  }} />
);

const SbCell = ({ value, label, color }) => (
  <div style={{
    padding:'26px 20px', textAlign:'center',
    borderRight:'1px solid var(--fl-line)', flex:1
  }}>
    <div className="fl-anton" style={{fontSize:38,lineHeight:1,color}}>
      {value}
    </div>
    <div style={{
      marginTop:8, fontSize:11, letterSpacing:'0.12em',
      textTransform:'uppercase', color:'var(--fl-ink-faint)'
    }}>
      {label}
    </div>
  </div>
);

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{
    display:'flex', borderBottom:'1px solid var(--fl-line-strong)',
    maxWidth:1080, margin:'0 auto', padding:'0 4px'
  }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onSelect(t.id)}
        style={{
          padding:'14px 20px', fontSize:13,
          color: active===t.id ? 'var(--fl-gold)' : 'var(--fl-ink-faint)',
          borderBottom: active===t.id ? '2px solid var(--fl-gold)' : '2px solid transparent',
          fontWeight: active===t.id ? 600 : 400,
          letterSpacing:'0.02em', background:'none', border:'none',
          cursor:'pointer', transition:'all 0.15s'
        }}
      >
        {t.label}
      </button>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <div className="fl-anton" style={{
    fontSize:13, letterSpacing:'0.15em',
    textTransform:'uppercase', color:'var(--fl-gold)', marginBottom:20
  }}>
    {children}
  </div>
);

/* ── Pre-auction landing (not started yet) ── */
const PreAuctionHero = ({ teams, players, maxTokens }) => (
  <div style={{ padding:'72px 40px 60px', textAlign:'center' }}>
    <div style={{
      fontSize:12, letterSpacing:'0.25em',
      color:'var(--fl-ink-faint)', textTransform:'uppercase', marginBottom:6
    }}>
      Colruyt Group presents
    </div>
    <div className="fl-anton" style={{
      fontSize:13, letterSpacing:'0.15em',
      color:'var(--fl-gold)', textTransform:'uppercase', marginBottom:20
    }}>
      Colruyt Premier League 2026
    </div>
    <div className="fl-anton" style={{
      fontSize: window.innerWidth < 600 ? 42 : 60,
      textTransform:'uppercase', lineHeight:1, marginBottom:16,
      background:'linear-gradient(180deg, var(--fl-ink), var(--fl-teal))',
      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
      backgroundClip:'text'
    }}>
      Live Auction
    </div>

    {/* Status pill */}
    <div style={{
      display:'inline-flex', alignItems:'center', gap:10,
      background:'var(--fl-surface)', border:'1px solid var(--fl-line-strong)',
      borderRadius:100, padding:'10px 22px', marginBottom:40
    }}>
      <span style={{
        width:8, height:8, borderRadius:'50%',
        background:'var(--fl-amber)', display:'inline-block'
      }} />
      <span style={{fontSize:13, color:'var(--fl-ink-dim)', fontWeight:500}}>
        Awaiting auction start
      </span>
    </div>

    {/* KPI strip */}
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(3,1fr)',
      maxWidth:680, margin:'0 auto',
      background:'var(--fl-surface)', border:'1px solid var(--fl-line-strong)',
      borderRadius:4
    }}>
      {[
        { label:'Teams Ready', value: Object.keys(teams).length, color:'var(--fl-teal)' },
        { label:'Players Available', value: players.length, color:'var(--fl-gold)' },
        { label:'Total Budget', value: `${(maxTokens * Object.keys(teams).length).toLocaleString()} 🪙`, color:'var(--fl-purple)' }
      ].map((item,i) => (
        <div key={i} style={{
          padding:'28px 16px', textAlign:'center',
          borderRight: i < 2 ? '1px solid var(--fl-line)' : 'none'
        }}>
          <div className="fl-anton" style={{fontSize:34, color:item.color, lineHeight:1}}>
            {item.value}
          </div>
          <div style={{
            marginTop:8, fontSize:11, letterSpacing:'0.12em',
            textTransform:'uppercase', color:'var(--fl-ink-faint)'
          }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>

    <div style={{marginTop:36, fontSize:13, color:'var(--fl-ink-faint)'}}>
      This page will automatically update when the auction begins
    </div>
  </div>
);

/* ── Auction-complete panel ── */
const AuctionCompletePanel = ({ totalSold, totalUnsold, totalSpent }) => (
  <div style={{ padding:'60px 40px', textAlign:'center', maxWidth:1080, margin:'0 auto' }}>
    {/* Trophy with rings */}
    <div style={{ position:'relative', width:120, height:120, margin:'0 auto 24px' }}>
      {[0,-16,-32].map((offset,i) => (
        <div key={i} style={{
          position:'absolute', inset:offset,
          border:`1px solid ${i===0?'var(--fl-line-strong)':i===1?'var(--fl-line)':'rgba(169,119,15,0.08)'}`,
          borderRadius:'50%'
        }} />
      ))}
      <div style={{
        position:'absolute', inset:0, display:'flex',
        alignItems:'center', justifyContent:'center', fontSize:44
      }}>🏆</div>
    </div>

    <div className="fl-anton" style={{
      fontSize:36, textTransform:'uppercase', letterSpacing:'0.02em', color:'var(--fl-ink)'
    }}>
      Auction Complete
    </div>
    <div style={{ marginTop:8, color:'var(--fl-ink-dim)', fontSize:14 }}>
      All {totalSold + totalUnsold} players have been processed
    </div>

    <div style={{
      display:'grid', gridTemplateColumns:'repeat(3,1fr)',
      gap:14, maxWidth:720, margin:'36px auto 0'
    }}>
      {[
        { value: totalSold, label:'Players Sold', color:'var(--fl-teal)' },
        { value: totalUnsold, label:'Unsold Players', color:'var(--fl-amber)' },
        { value: totalSpent.toLocaleString(), label:'Total Spent 🪙', color:'var(--fl-gold)' }
      ].map((item,i) => (
        <div key={i} style={{
          background:'var(--fl-surface-2)', border:'1px solid var(--fl-line-strong)',
          borderRadius:4, padding:'24px 16px'
        }}>
          <div className="fl-mono" style={{fontSize:30, fontWeight:600, color:item.color}}>
            {item.value}
          </div>
          <div style={{
            marginTop:6, fontSize:11, letterSpacing:'0.1em',
            textTransform:'uppercase', color:'var(--fl-ink-faint)'
          }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── Current player on auction ── */
const CurrentPlayerPanel = ({ currentPlayer, currentPhase }) => (
  <div style={{ maxWidth:1080, margin:'0 auto', padding:'40px 40px 0' }}>
    <SectionTitle>Now on auction</SectionTitle>
    <div style={{
      display:'grid', gridTemplateColumns:'auto 1fr',
      gap:40, alignItems:'start',
      background:'var(--fl-surface)', border:'1px solid var(--fl-line-strong)',
      borderRadius:4, overflow:'hidden'
    }}>
      {/* Photo */}
      <div style={{ width:220, flexShrink:0, alignSelf:'stretch', minHeight:280 }}>
        <img
          src={currentPlayer.PhotoFileName
            ? `/players/${currentPlayer.PhotoFileName}`
            : '/placeholder-player.svg'}
          alt={currentPlayer.Name}
          style={{
            width:'100%', height:'100%', objectFit:'cover',
            objectPosition:'top', display:'block', minHeight:280
          }}
          onError={e => { e.target.src = '/placeholder-player.svg'; }}
        />
      </div>

      {/* Details */}
      <div style={{ padding:'32px 32px 32px 0' }}>
        <div style={{
          fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase',
          color:'var(--fl-ink-faint)', marginBottom:6
        }}>
          {ROLE_EMOJIS[currentPlayer.Role]} {currentPlayer.Role} · ID {currentPlayer.PlayerID}
        </div>
        <div className="fl-anton" style={{
          fontSize: window.innerWidth < 600 ? 28 : 40,
          color:'var(--fl-ink)', lineHeight:1.05, marginBottom:20
        }}>
          {currentPlayer.Name}
        </div>

        {/* Base price badge */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          background:'var(--fl-surface-2)', border:'1px solid var(--fl-line-strong)',
          borderRadius:4, padding:'10px 18px', marginBottom:24
        }}>
          <span style={{fontSize:12, color:'var(--fl-ink-faint)', letterSpacing:'0.08em'}}>BASE PRICE</span>
          <span className="fl-mono" style={{fontSize:22, fontWeight:600, color:'var(--fl-gold)'}}>
            🪙 {currentPlayer.BaseTokens}
          </span>
        </div>

        {/* Phase progress */}
        {currentPhase && (
          <div>
            <div style={{
              display:'flex', justifyContent:'space-between', marginBottom:6,
              fontSize:12, color:'var(--fl-ink-dim)'
            }}>
              <span>{currentPhase.phaseName} — Phase {currentPhase.phase}/{currentPhase.totalPhases}</span>
              <span>{currentPhase.categoryProgress.current}/{currentPhase.categoryProgress.total} players</span>
            </div>
            <div style={{
              height:4, background:'var(--fl-line-strong)',
              borderRadius:2, overflow:'hidden'
            }}>
              <motion.div
                initial={{ width:0 }}
                animate={{ width: `${currentPhase.categoryProgress.percentage}%` }}
                transition={{ duration:0.6 }}
                style={{ height:'100%', background:'var(--fl-teal)', borderRadius:2 }}
              />
            </div>
          </div>
        )}

        {/* Bidding in progress pill */}
        <div style={{
          marginTop:24, display:'inline-flex', alignItems:'center', gap:8,
          background:'rgba(169,119,15,0.08)', border:'1px solid rgba(169,119,15,0.25)',
          borderRadius:100, padding:'8px 16px'
        }}>
          <motion.span
            animate={{ opacity:[1,0.3,1] }}
            transition={{ duration:1.4, repeat:Infinity }}
            style={{ width:7, height:7, borderRadius:'50%', background:'var(--fl-gold)', display:'inline-block' }}
          />
          <span style={{ fontSize:12, color:'var(--fl-gold)', fontWeight:600 }}>
            Bidding in progress
          </span>
        </div>
      </div>
    </div>
  </div>
);

/* ── Leaderboard panel ── */
const LeaderboardPanel = ({ teamStats, auctionHistory }) => (
  <div style={{ maxWidth:1080, margin:'0 auto', padding:'40px 40px 0' }}>
    <SectionTitle>Team Leaderboard</SectionTitle>

    <div style={{ border:'1px solid var(--fl-line-strong)', borderRadius:4, overflow:'hidden', background:'var(--fl-surface)' }}>
      {teamStats.map((team, i) => (
        <motion.div
          key={team.name}
          initial={{ opacity:0, x:-12 }}
          animate={{ opacity:1, x:0 }}
          transition={{ delay: i*0.05 }}
          style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'16px 24px',
            borderBottom: i < teamStats.length-1 ? '1px solid var(--fl-line)' : 'none',
            background: i===0 ? 'rgba(169,119,15,0.05)' : 'transparent'
          }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            {/* Rank */}
            <div className="fl-mono" style={{
              width:28, textAlign:'center', fontSize:13, fontWeight:600,
              color: i===0?'var(--fl-gold)': i===1?'var(--fl-ink-dim)': i===2?'var(--fl-amber)': 'var(--fl-ink-faint)'
            }}>
              {i+1}
            </div>
            <div>
              <div style={{ fontWeight:600, color:'var(--fl-ink)', fontSize:14 }}>{team.name}</div>
              <div style={{ fontSize:12, color:'var(--fl-ink-faint)', marginTop:2 }}>
                {team.players} players · avg 🪙 {team.avgPrice}
              </div>
            </div>
          </div>

          <div style={{ textAlign:'right' }}>
            <div className="fl-mono" style={{ fontSize:18, fontWeight:600, color:'var(--fl-purple)' }}>
              🪙 {team.tokensSpent.toLocaleString()}
            </div>
            <div style={{ fontSize:12, color:'var(--fl-ink-faint)', marginTop:2 }}>
              🪙 {team.tokensLeft.toLocaleString()} remaining
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Recent sales */}
    {auctionHistory.length > 0 && (
      <div style={{ marginTop:40 }}>
        <SectionTitle>Recent Transactions</SectionTitle>
        <div style={{ border:'1px solid var(--fl-line-strong)', borderRadius:4, overflow:'hidden', background:'var(--fl-surface)' }}>
          {auctionHistory.slice(-5).reverse().map((tx, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'14px 24px',
              borderBottom: i < 4 ? '1px solid var(--fl-line)' : 'none'
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:18 }}>{ROLE_EMOJIS[tx.Role]}</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:'var(--fl-ink)' }}>{tx.Player}</div>
                  <div style={{ fontSize:12, color:'var(--fl-ink-faint)' }}>{tx.Role}</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="fl-mono" style={{ fontWeight:600, color:'var(--fl-teal)', fontSize:14 }}>
                  🪙 {tx.SoldPrice}
                </div>
                <div style={{ fontSize:12, color:'var(--fl-ink-faint)' }}>{tx.Team}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

/* ── Wrapped sub-panels (team status, category) ── */
const WrappedPanel = ({ children }) => (
  <div style={{ maxWidth:1080, margin:'0 auto', padding:'40px 40px 0' }}>
    {children}
  </div>
);

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
const HomePage = ({ auctionState }) => {
  injectTheme();

  const [activeView, setActiveView] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { auctionStarted, currentPlayerIdx, players, teams,
          auctionHistory, unsoldPlayers, maxTokens } = auctionState;

  const currentPlayer = auctionStarted && currentPlayerIdx < players.length
    ? players[currentPlayerIdx] : null;
  const currentPhase  = currentPlayer
    ? getCurrentAuctionPhase(players, currentPlayerIdx) : null;
  const isComplete    = currentPlayerIdx >= players.length && auctionStarted;
  const totalSold     = auctionHistory.length;
  const totalUnsold   = unsoldPlayers.length;
  const totalProcessed = totalSold + totalUnsold;
  const totalSpent    = auctionHistory.reduce((s,h) => s + h.SoldPrice, 0);

  const teamStats = Object.entries(teams).map(([name, d]) => ({
    name, players: d.squad?.length||0,
    tokensLeft: d.tokensLeft||0,
    tokensSpent: (d.maxTokens||0)-(d.tokensLeft||0),
    avgPrice: (d.squad?.length||0)>0
      ? Math.round(((d.maxTokens||0)-(d.tokensLeft||0)) / d.squad.length) : 0
  })).sort((a,b) => b.tokensSpent - a.tokensSpent);

  const TABS = [
    { id:'overview',    label:'Live overview' },
    { id:'teams',       label:'Team status' },
    { id:'progress',    label:'Category progress' },
    { id:'leaderboard', label:'Leaderboard' }
  ];

  const pageStyle = {
    minHeight:'100vh', fontFamily:"'IBM Plex Sans', sans-serif",
    background:`
      radial-gradient(ellipse 900px 460px at 50% -8%, rgba(169,119,15,0.10), transparent 60%),
      radial-gradient(ellipse 700px 380px at 12% 10%, rgba(15,110,86,0.08), transparent 60%),
      #F4F1E6`,
    color:'var(--fl-ink)'
  };

  /* ── NOT STARTED ── */
  if (!auctionStarted) {
    return (
      <div style={pageStyle}>
        <PreAuctionHero teams={teams} players={players} maxTokens={maxTokens} />
        <div style={{
          textAlign:'center', padding:'0 0 32px',
          fontSize:12, color:'var(--fl-ink-faint)', letterSpacing:'0.05em'
        }}>
          Live updates every few seconds · Public viewing page
        </div>
      </div>
    );
  }

  /* ── AUCTION ACTIVE / COMPLETE ── */
  return (
    <div style={pageStyle}>

      {/* ── Hero ── */}
      <div style={{
        padding:'64px 40px 0', textAlign:'center', position:'relative', overflow:'hidden'
      }}>
        {/* conic light sweep */}
        <div style={{
          position:'absolute', top:-220, left:'50%', transform:'translateX(-50%)',
          width:1000, height:520, pointerEvents:'none',
          background:`conic-gradient(from 200deg at 50% 0%, transparent,
            rgba(169,119,15,0.10) 15%, transparent 30%)`
        }} />

        {/* Sponsor + comp label */}
        <div style={{
          fontSize:12, letterSpacing:'0.25em',
          color:'var(--fl-ink-faint)', textTransform:'uppercase', marginBottom:6
        }}>
          Colruyt Group presents
        </div>
        <div className="fl-anton" style={{
          fontSize:13, letterSpacing:'0.15em',
          color:'var(--fl-gold)', textTransform:'uppercase', marginBottom:18
        }}>
          Colruyt Premier League 2026
        </div>

        {/* Main title */}
        <h1 className="fl-anton" style={{
          fontSize: window.innerWidth < 600 ? 42 : 56,
          letterSpacing:'0.01em', textTransform:'uppercase',
          background:'linear-gradient(180deg, var(--fl-ink), var(--fl-teal))',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          backgroundClip:'text', lineHeight:1, margin:0
        }}>
          Live Auction
        </h1>

        {/* Timestamp */}
        <div style={{
          marginTop:12, fontSize:13, color:'var(--fl-ink-dim)',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8
        }}>
          <LiveDot />
          {currentTime.toLocaleString()} — live updates
        </div>

        {/* Scoreboard */}
        <div style={{
          maxWidth:1080, margin:'36px auto 0', display:'grid',
          gridTemplateColumns:'repeat(4,1fr)',
          background:'var(--fl-surface)', border:'1px solid var(--fl-line-strong)',
          borderRadius:4, position:'relative', zIndex:1,
          boxShadow:'0 1px 0 rgba(27,42,34,0.03)'
        }}>
          <SbCell value={`${totalProcessed}/${players.length}`} label="Players processed" color="var(--fl-teal)" />
          <SbCell value={totalSold} label="Players sold" color="var(--fl-gold)" />
          <SbCell value={totalUnsold} label="Unsold players" color="var(--fl-amber)" />
          <div style={{ padding:'26px 20px', textAlign:'center', flex:1 }}>
            <div className="fl-anton" style={{
              fontSize: isComplete ? 22 : 38, lineHeight:1,
              color:'var(--fl-purple)'
            }}>
              {isComplete ? 'Complete' : (currentPhase ? `${currentPhase.phase}/4` : '—')}
            </div>
            <div style={{
              marginTop:8, fontSize:11, letterSpacing:'0.12em',
              textTransform:'uppercase', color:'var(--fl-ink-faint)'
            }}>
              Auction phase
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <TabBar tabs={TABS} active={activeView} onSelect={setActiveView} />
      </div>

      {/* ── Panel content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity:0, y:8 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-8 }}
          transition={{ duration:0.2 }}
          style={{ paddingBottom:60 }}
        >
          {activeView === 'overview' && (
            isComplete
              ? <AuctionCompletePanel totalSold={totalSold} totalUnsold={totalUnsold} totalSpent={totalSpent} />
              : currentPlayer
                ? <CurrentPlayerPanel currentPlayer={currentPlayer} currentPhase={currentPhase} />
                : (
                  <div style={{ textAlign:'center', padding:'60px 40px', color:'var(--fl-ink-dim)' }}>
                    <div className="fl-anton" style={{ fontSize:28 }}>Auction in progress</div>
                    <div style={{ marginTop:8, fontSize:14 }}>Waiting for next player...</div>
                  </div>
                )
          )}

          {activeView === 'teams' && (
            <WrappedPanel>
              <SectionTitle>Team Status</SectionTitle>
              <TeamDashboard teams={teams} />
            </WrappedPanel>
          )}

          {activeView === 'progress' && (
            <WrappedPanel>
              <SectionTitle>Category Progress</SectionTitle>
              <CategoryProgress
                players={players}
                currentPlayerIdx={currentPlayerIdx}
                teams={teams}
                auctionHistory={auctionHistory}
              />
              <div style={{ marginTop:24 }}>
                <AuctionProgress
                  players={players}
                  currentPlayerIdx={currentPlayerIdx}
                  auctionHistory={auctionHistory}
                  unsoldPlayers={unsoldPlayers}
                  isComplete={isComplete}
                />
              </div>
            </WrappedPanel>
          )}

          {activeView === 'leaderboard' && (
            <LeaderboardPanel teamStats={teamStats} auctionHistory={auctionHistory} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div style={{
        textAlign:'center', padding:'0 24px 24px',
        fontSize:11, color:'var(--fl-ink-faint)',
        letterSpacing:'0.05em', borderTop:'1px solid var(--fl-line-strong)'
      }}>
        Live updates every few seconds · Public viewing page
      </div>

    </div>
  );
};

export default HomePage;
