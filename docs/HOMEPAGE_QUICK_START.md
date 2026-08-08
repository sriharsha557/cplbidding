# Homepage Redesign - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Copy Files (Already Done ✅)
All new components, utilities, and docs are in the repository:
- `src/components/PhaseStepper.js`
- `src/components/DynamicStatusCard.js`
- `src/components/TeamSnapshot.js`
- `src/components/TransparencyFeed.js`
- `src/components/HomePageEnhanced.js`
- `src/utils/leaguePhaseUtils.js`

### 2. Update App.js (5 minutes)

Add these imports at the top:
```javascript
import HomePageEnhanced from './components/HomePageEnhanced';
import { calculateRetentionStats, calculateTradingStats } from './utils/leaguePhaseUtils';
```

Add these states after existing state declarations:
```javascript
const [leaguePhase, setLeaguePhase] = useState('retention'); // retention | trading | auction
const [retentionDeadline, setRetentionDeadline] = useState(null);
const [tradingDeadline, setTradingDeadline] = useState(null);
const [retentionEvents, setRetentionEvents] = useState([]);
const [tradingEvents, setTradingEvents] = useState([]);
```

Replace the HomePage rendering section with:
```javascript
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
  <AdminPage 
    // ... existing admin props
  />
)}
```

### 3. Test Locally

```bash
npm start
# Visit http://localhost:3000
# You should see the new phase-based homepage
```

### 4. Test Phase Switching

Edit App.js and change the initial state to test each phase:
```javascript
// Test retention phase
const [leaguePhase, setLeaguePhase] = useState('retention');

// Test trading phase
const [leaguePhase, setLeaguePhase] = useState('trading');

// Test auction phase - will use original auction view
const [leaguePhase, setLeaguePhase] = useState('auction');
```

---

## 📊 Component Props Cheat Sheet

### HomePageEnhanced (Main Component)
```jsx
<HomePageEnhanced
  auctionState={auctionState}           // Required - existing state
  leaguePhase="retention"               // retention|trading|auction
  retentionDeadline={new Date(...)}     // ISO date string or Date object
  tradingDeadline={new Date(...)}       // ISO date string or Date object
  retentionEvents={[]}                  // Array of retention events
  tradingEvents={[]}                    // Array of trading events
/>
```

### Quick Props for Testing
```javascript
// Retention phase sample
{
  leaguePhase: 'retention',
  retentionDeadline: new Date(Date.now() + 24*60*60*1000), // 24h from now
  retentionEvents: [
    { teamName: 'CSK', playerName: 'MS Dhoni', price: 300 }
  ]
}

// Trading phase sample
{
  leaguePhase: 'trading',
  tradingDeadline: new Date(Date.now() + 24*60*60*1000),
  tradingEvents: [
    { fromTeam: 'CSK', toTeam: 'RCB', playerName: 'Test', status: 'completed' }
  ]
}
```

---

## 🎨 Visual Preview

### Retention Phase Shows:
```
┌─────────────────────────────┐
│ 🔒 Phase Stepper            │ ← Shows all 3 phases
├─────────────────────────────┤
│ 🔒 Retention Live           │ ← Dynamic status card
│ Deadline: 5d 12h remaining  │
│ Teams submitted: 5/8        │
│ Players retained: 45        │
├─────────────────────────────┤
│ Team Snapshots (Grid)       │ ← Shows retained players
│ Team 1: 5 retained, 🪙 300  │
│ Team 2: 4 retained, 🪙 350  │
├─────────────────────────────┤
│ Live Activity Feed          │ ← Shows retention events
│ 🔒 CSK retained MS Dhoni    │
│ 🔒 RCB retained Virat       │
└─────────────────────────────┘
```

### Trading Phase Shows:
```
┌─────────────────────────────┐
│ 🔁 Phase Stepper            │ ← Highlights trading
├─────────────────────────────┤
│ 🔁 Trading Open             │ ← Different colors
│ Deadline: 3d remaining      │
│ Total trades: 12            │
│ Pending approvals: 2 ⚠️     │ ← Alert if > 0
├─────────────────────────────┤
│ Team Snapshots (Updated)    │
│ Shows budget changes        │
├─────────────────────────────┤
│ Trade Activity Feed         │
│ 🔁 CSK traded Player X      │
│ 🔁 RCB proposed trade       │
└─────────────────────────────┘
```

### Auction Phase Shows:
```
Original auction view (unchanged)
With live player bidding interface
```

---

## 🔧 Common Tasks

### Change Phase
```javascript
// In App.js or wherever state is managed
setLeaguePhase('retention');  // Start retention
setLeaguePhase('trading');    // Move to trading
setLeaguePhase('auction');    // Start auction
```

### Set Deadline (24 hours from now)
```javascript
const deadline = new Date();
deadline.setHours(deadline.getHours() + 24);
setRetentionDeadline(deadline);
```

### Add Retention Event
```javascript
setRetentionEvents(prev => [...prev, {
  teamName: 'CSK',
  playerName: 'MS Dhoni',
  playerID: '14HB',
  price: 300,
  timestamp: new Date()
}]);
```

### Add Trading Event
```javascript
setTradingEvents(prev => [...prev, {
  fromTeam: 'CSK',
  toTeam: 'RCB',
  playerName: 'Test Player',
  compensation: 'Another Player',
  status: 'completed',
  timestamp: new Date()
}]);
```

---

## 📱 Responsive Breakpoints

| Screen | Layout | Columns |
|--------|--------|---------|
| Mobile | Vertical | 1 |
| Tablet | 2-row | 2 |
| Desktop | Grid | 4 |

All components automatically adapt - no extra work needed!

---

## 🎯 Testing Checklist (10 minutes)

- [ ] Phase stepper displays all 3 phases
- [ ] Current phase is highlighted
- [ ] Status card shows correct metrics per phase
- [ ] Team cards display in grid
- [ ] Countdown timer updates
- [ ] Activity feed shows events
- [ ] Mobile layout works
- [ ] Hover effects work
- [ ] Colors match phase (red/blue/green)
- [ ] No console errors

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Components not found | Verify files copied to `/src/components/` |
| Props errors | Check prop names match component definition |
| Countdown not updating | Use valid Date object for deadline |
| Team logos not showing | Verify filename in team.logo matches file in `/public/` |
| Animations laggy | Reduce number of simultaneous animations on mobile |

---

## 📚 Documentation Map

| Document | Purpose | When to Read |
|----------|---------|--------------|
| HOMEPAGE_REDESIGN_GUIDE.md | Comprehensive reference | For implementation details |
| HOMEPAGE_API_SAMPLE.md | Data structure examples | For backend integration |
| HOMEPAGE_IMPLEMENTATION_CHECKLIST.md | Step-by-step tasks | For project planning |
| HOMEPAGE_REDESIGN_SUMMARY.md | Project overview | For high-level understanding |
| HOMEPAGE_QUICK_START.md | This file | For quick setup (5 min) |

---

## 💡 Pro Tips

1. **Use mock data while developing**: No API needed yet
2. **Test each phase separately**: Set leaguePhase to test specific views
3. **Check console logs**: Components log phase changes
4. **Inspect with React DevTools**: See prop values in real-time
5. **Use Tailwind classes**: All styling uses Tailwind for consistency
6. **Animations are optional**: Works fine with animations disabled
7. **Mobile first**: Always test mobile layout first

---

## 🎓 Next Steps

1. ✅ **Immediate**: Copy files + update App.js (5 min)
2. ✅ **Quick**: Test locally with mock data (10 min)
3. ⏳ **Soon**: Extend team data model with new fields
4. ⏳ **Soon**: Add admin phase controls to AdminPage
5. ⏳ **Later**: Create backend API endpoints
6. ⏳ **Later**: Add real data from database

---

## 🤝 Need Help?

1. **Can't find component**: Check `/src/components/` folder
2. **Props not working**: Review `HomePageEnhanced` component signature
3. **Data structure issue**: See `HOMEPAGE_API_SAMPLE.md`
4. **Styling wrong**: Check Tailwind class names match
5. **Animation problems**: Test with `leaguePhase` changing

---

## ✅ Success Criteria

✅ Homepage loads without errors  
✅ Phase stepper displays correctly  
✅ Status card shows phase-specific metrics  
✅ Team snapshots appear in grid  
✅ Activity feed shows events  
✅ Mobile responsive works  
✅ No console errors  

---

**Version**: 1.0.0  
**Last Updated**: August 2026  
**Status**: ✅ Ready for Development

