# CPL Auction Homepage Redesign Guide
## Phase-Based Architecture: Retention → Trading → Auction

---

## 📋 Overview

The homepage has been redesigned to support a **three-phase league structure**:

1. **🔒 Retention Phase** - Teams retain core players (pre-auction)
2. **🔁 Trading Phase** - Teams propose and approve trades
3. **🔨 Auction Phase** - Open auction for remaining players (existing functionality)

---

## 🎯 Key Components

### 1. **PhaseStepper** (`PhaseStepper.js`)
Visual progress indicator showing all three phases with completion states.

**Features:**
- Desktop: Horizontal stepper with connectors
- Mobile: Vertical card layout
- Animated phase transitions
- Status indicators: pending, active, completed

**Usage:**
```jsx
<PhaseStepper 
  currentPhase="retention"
  completedPhases={['retention']} // for trading phase
/>
```

---

### 2. **DynamicStatusCard** (`DynamicStatusCard.js`)
Phase-aware status display with real-time metrics and countdown timers.

**Phase-Specific Views:**

**Retention Phase:**
- Deadline countdown
- Teams submitted count
- Players retained
- Purse remaining after retention

**Trading Phase:**
- Deadline countdown
- Total trades completed
- Pending approvals (alert if > 0)
- Most active team

**Auction Phase:**
- Players processed
- Players sold/unsold
- Auction progress percentage

**Usage:**
```jsx
<DynamicStatusCard
  currentPhase="retention"
  retentionDeadline={new Date('2025-01-15')}
  retentionStats={{
    teamsSubmitted: 5,
    teamsTotal: 8,
    totalPlayersRetained: 45,
    totalPurseRemaining: 2400
  }}
/>
```

---

### 3. **TeamSnapshot** (`TeamSnapshot.js`)
Horizontal team cards showing retention status, budget, and role distribution.

**Displays:**
- Team logo and name
- Player count
- Purse remaining (with progress bar)
- Retained players (small avatar badges)
- Role distribution breakdown
- Budget usage visualization

**Usage:**
```jsx
<TeamSnapshot 
  teams={auctionState.teams}
  currentPhase="retention"
/>
```

---

### 4. **TransparencyFeed** (`TransparencyFeed.js`)
Live activity feed showing recent events based on phase.

**Content by Phase:**

| Phase | Events |
|-------|--------|
| Retention | "Team X retained Player Y for 120 tokens" |
| Trading | "Team A traded Player X to Team B" |
| Auction | "Player Z sold to Team C for 150 tokens" |

**Features:**
- Animated list with emoji indicators
- Recent 5 events displayed
- Phase-aware event formatting
- "Load More" functionality

**Usage:**
```jsx
<TransparencyFeed
  currentPhase="retention"
  auctionHistory={auctionState.auctionHistory}
  retentionEvents={retentionEvents}
  tradingEvents={tradingEvents}
/>
```

---

### 5. **HomePageEnhanced** (`HomePageEnhanced.js`)
Complete redesigned homepage supporting both pre-auction and live auction views.

**Props:**
```jsx
<HomePageEnhanced
  auctionState={{...}}          // Existing auction state
  leaguePhase="retention"       // Current league phase
  retentionDeadline={Date}      // Optional deadline
  tradingDeadline={Date}        // Optional deadline
  retentionEvents={[]}          // Retention history events
  tradingEvents={[]}            // Trading history events
/>
```

---

## 🔧 Data Model Changes

### Frontend State Structure
```javascript
const leagueState = {
  currentPhase: 'retention',    // 'retention' | 'trading' | 'auction'
  retentionDeadline: Date,
  tradingDeadline: Date,
  
  // Retention phase data
  retentionStats: {
    teamsSubmitted: 5,
    teamsTotal: 8,
    totalPlayersRetained: 45,
    averagePlayersPerTeam: 5.6,
    totalPurseRemaining: 2400,
    purseUsedForRetention: 7800
  },
  
  // Trading phase data
  tradingStats: {
    totalTrades: 12,
    pendingApprovals: 2,
    approvedTrades: 8,
    completedTrades: 8,
    mostActiveTeam: "CSK",
    mostActiveTeamTrades: 4
  },
  
  // Existing auction state
  auctionState: {...}
};
```

### Team Object Extensions
```javascript
team = {
  // Existing fields
  name: "CSK",
  squad: [],
  tokensLeft: 500,
  maxTokens: 1200,
  
  // Retention phase
  retentionSubmitted: true,
  retentionBudgetUsed: 400,
  
  // Trading phase
  trades: [
    {
      id: "trade-1",
      playerID: "14HB",
      fromTeam: "CSK",
      toTeam: "RCB",
      compensation: "Player X",
      status: "approved",  // pending | approved | completed
      timestamp: Date
    }
  ]
};
```

### Event Objects
```javascript
// Retention Event
retentionEvent = {
  id: "ret-1",
  teamName: "CSK",
  playerName: "Mahendra Singh Dhoni",
  price: 120,
  timestamp: Date
};

// Trading Event
tradingEvent = {
  id: "trade-1",
  fromTeam: "CSK",
  toTeam: "RCB",
  playerName: "MS Dhoni",
  compensation: "Virat Kohli",
  status: "completed",
  timestamp: Date
};
```

---

## 🎨 Visual Design

### Color Scheme
- **Retention**: 🔴 Red/Orange gradient (`from-red-500 to-orange-500`)
- **Trading**: 🔵 Blue/Cyan gradient (`from-blue-500 to-cyan-500`)
- **Auction**: 🟢 Green/Emerald gradient (`from-green-500 to-emerald-500`)

### Layout Structure (Pre-Auction)
```
┌─────────────────────────────────────┐
│  Logo & Title                       │
├─────────────────────────────────────┤
│  Phase Stepper (Horizontal/Mobile)  │  ← NEW
├─────────────────────────────────────┤
│  Dynamic Status Card                │  ← NEW
│  (Phase-specific metrics)           │
├─────────────────────────────────────┤
│  Quick KPI Cards (4 columns)        │  ← ENHANCED
│  - Teams Ready                      │
│  - Players Available                │
│  - Total Budget                     │
│  - Current Phase                    │
├─────────────────────────────────────┤
│  Team Snapshots (Grid)              │  ← NEW
│  (Status per team)                  │
├─────────────────────────────────────┤
│  Transparency Feed                  │  ← NEW
│  (Live activity)                    │
├─────────────────────────────────────┤
│  Footer with Phase Message          │  ← ENHANCED
└─────────────────────────────────────┘
```

---

## 📊 Retention Statistics Calculation

```javascript
calculateRetentionStats(teams) {
  let teamsSubmitted = 0;
  let totalPlayersRetained = 0;
  let purseUsedForRetention = 0;
  
  Object.values(teams).forEach(team => {
    if (team.retentionSubmitted) teamsSubmitted++;
    totalPlayersRetained += team.squad.filter(p => p.IsRetained).length;
    purseUsedForRetention += team.retentionBudgetUsed || 0;
  });
  
  return {
    teamsSubmitted,
    teamsTotal: Object.keys(teams).length,
    totalPlayersRetained,
    averagePlayersPerTeam: totalPlayersRetained / teams.length,
    totalPurseRemaining: teams.reduce((sum, t) => sum + t.tokensLeft, 0),
    purseUsedForRetention
  };
}
```

---

## 📈 Trading Statistics Calculation

```javascript
calculateTradingStats(teams) {
  let stats = {
    totalTrades: 0,
    pendingApprovals: 0,
    approvedTrades: 0,
    completedTrades: 0,
    mostActiveTeam: null,
    mostActiveTeamTrades: 0
  };
  
  const teamTradeCount = {};
  
  Object.entries(teams).forEach(([teamName, team]) => {
    team.trades?.forEach(trade => {
      stats.totalTrades++;
      if (trade.status === 'pending') stats.pendingApprovals++;
      if (trade.status === 'approved') stats.approvedTrades++;
      if (trade.status === 'completed') stats.completedTrades++;
      
      teamTradeCount[teamName] = (teamTradeCount[teamName] || 0) + 1;
    });
  });
  
  // Find most active
  Object.entries(teamTradeCount).forEach(([team, count]) => {
    if (count > stats.mostActiveTeamTrades) {
      stats.mostActiveTeam = team;
      stats.mostActiveTeamTrades = count;
    }
  });
  
  return stats;
}
```

---

## 🔄 Phase Transition Flow

```
[Retention] → (deadline passed)
    ↓
[Trading] → (deadline passed or approved)
    ↓
[Auction] → (auction complete)
    ↓
[Complete]
```

### State Management
```javascript
// In App.js or AdminPage
const [leaguePhase, setLeaguePhase] = useState('retention');

// When retention deadline passes
if (new Date() > retentionDeadline) {
  setLeaguePhase('trading');
}

// When trading deadline passes
if (new Date() > tradingDeadline) {
  setLeaguePhase('auction');
}

// When auction starts
if (auctionState.auctionStarted) {
  // Phase is already 'auction'
}
```

---

## 🚀 Implementation Steps

### Step 1: Add New Components
- ✅ Copy `PhaseStepper.js`
- ✅ Copy `DynamicStatusCard.js`
- ✅ Copy `TeamSnapshot.js`
- ✅ Copy `TransparencyFeed.js`
- ✅ Copy `HomePageEnhanced.js`

### Step 2: Add Utilities
- ✅ Copy `leaguePhaseUtils.js` to `/src/utils/`

### Step 3: Update App.js
Replace existing HomePage import:
```javascript
// OLD
import HomePage from './components/HomePage';

// NEW - Use when not in auction
import HomePageEnhanced from './components/HomePageEnhanced';

// In render:
{currentView === 'home' ? (
  <HomePageEnhanced 
    auctionState={auctionState}
    leaguePhase={leaguePhase}
    retentionDeadline={retentionDeadline}
    tradingDeadline={tradingDeadline}
    retentionEvents={retentionEvents}
    tradingEvents={tradingEvents}
  />
) : (
  // ... admin view
)}
```

### Step 4: Test Phases
1. Test Retention view with `leaguePhase="retention"`
2. Test Trading view with `leaguePhase="trading"`
3. Test Auction view (unchanged - uses original logic)

---

## 🎯 Empty State Handling

All components handle empty states gracefully:

```jsx
// Team Snapshots
if (teamArray.length === 0) {
  return <div>No teams initialized yet</div>;
}

// Transparency Feed
if (displayEvents.length === 0) {
  return <div>No activity yet</div>;
}
```

---

## 🔌 Sample Integration

```jsx
// In App.js
function App() {
  const [leaguePhase, setLeaguePhase] = useState('retention');
  const [retentionDeadline, setRetentionDeadline] = useState(null);
  const [retentionEvents, setRetentionEvents] = useState([]);
  
  return (
    <HomePageEnhanced
      auctionState={auctionState}
      leaguePhase={leaguePhase}
      retentionDeadline={retentionDeadline}
      tradingDeadline={tradingDeadline}
      retentionEvents={retentionEvents}
      tradingEvents={tradingEvents}
    />
  );
}
```

---

## 📱 Responsive Breakpoints

- **Mobile** (< 768px): Vertical layouts, single column grids
- **Tablet** (768px - 1024px): 2-column grids
- **Desktop** (> 1024px): 4-column grids

All components use Tailwind's `md:` prefix for responsive design.

---

## 🎬 Animations

- Phase Stepper: Pulsing active phase, animated connectors
- Status Cards: Slide-in animations with staggered delays
- Team Cards: Hover scale effects, gradient backgrounds
- Feed Items: Entrance animations with staggered timing
- Progress bars: Smooth width transitions

---

## 🔍 Testing Checklist

- [ ] Phase stepper displays all 3 phases
- [ ] Current phase highlighted/animated
- [ ] Completed phases show checkmarks
- [ ] Status card shows correct metrics per phase
- [ ] Team snapshots display retention indicators
- [ ] Transparency feed updates with new events
- [ ] Empty states render correctly
- [ ] Mobile responsiveness works
- [ ] Countdown timer updates every second
- [ ] Color gradients apply correctly per phase
- [ ] Animations don't lag on mobile

---

## 🔮 Future Enhancements

1. **Countdown Urgency**: Red pulse when < 24 hours to deadline
2. **Team Profiles**: Click team card to see detailed retention plan
3. **Trade Management**: In-feed trade approval buttons
4. **Notifications**: Toast alerts for phase transitions
5. **Analytics**: Phase completion statistics
6. **Export Reports**: Download phase summaries as PDF

---

## 📚 Files Changed

**New Files:**
- `src/utils/leaguePhaseUtils.js`
- `src/components/PhaseStepper.js`
- `src/components/DynamicStatusCard.js`
- `src/components/TeamSnapshot.js`
- `src/components/TransparencyFeed.js`
- `src/components/HomePageEnhanced.js`
- `docs/HOMEPAGE_REDESIGN_GUIDE.md`

**Modified Files:**
- `src/App.js` (add leaguePhase state and props)

**Existing (Unchanged):**
- `src/components/HomePage.js` (original - kept for reference)

---

## 🤝 Support

For questions or issues with the redesign:
1. Check component prop requirements
2. Verify data model structure
3. Test with sample data
4. Review component examples in this guide

