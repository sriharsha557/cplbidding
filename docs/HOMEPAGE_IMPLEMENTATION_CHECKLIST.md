# Homepage Redesign Implementation Checklist

## Phase 1: Setup & File Organization ✅

- [x] Create `src/utils/leaguePhaseUtils.js`
- [x] Create `src/components/PhaseStepper.js`
- [x] Create `src/components/DynamicStatusCard.js`
- [x] Create `src/components/TeamSnapshot.js`
- [x] Create `src/components/TransparencyFeed.js`
- [x] Create `src/components/HomePageEnhanced.js`
- [x] Create `docs/HOMEPAGE_REDESIGN_GUIDE.md`
- [x] Create `docs/HOMEPAGE_API_SAMPLE.md`
- [x] Create this checklist

---

## Phase 2: Component Integration

### 2.1 Update App.js
- [ ] Import `HomePageEnhanced` from components
- [ ] Add state for `leaguePhase` (default: 'retention')
- [ ] Add state for `retentionDeadline`
- [ ] Add state for `tradingDeadline`
- [ ] Add state for `retentionEvents` array
- [ ] Add state for `tradingEvents` array
- [ ] Add useEffect to poll phase updates
- [ ] Pass new props to `HomePage` or `HomePageEnhanced`

**Sample Code:**
```javascript
// In App.js
const [leaguePhase, setLeaguePhase] = useState('retention');
const [retentionDeadline, setRetentionDeadline] = useState(null);
const [tradingDeadline, setTradingDeadline] = useState(null);
const [retentionEvents, setRetentionEvents] = useState([]);
const [tradingEvents, setTradingEvents] = useState([]);

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
) : null}
```

---

## Phase 3: Data Model Enhancements

### 3.1 Team Object Extensions
- [ ] Add `team.retentionSubmitted` boolean field
- [ ] Add `team.retentionBudgetUsed` number field
- [ ] Add `team.trades` array field with trade objects
- [ ] Add trade object structure:
  - [ ] `trade.id` (string)
  - [ ] `trade.playerID` (string)
  - [ ] `trade.fromTeam` (string)
  - [ ] `trade.toTeam` (string)
  - [ ] `trade.compensation` (string, optional)
  - [ ] `trade.status` (pending|approved|completed)
  - [ ] `trade.timestamp` (Date)

**Migration Script Needed:**
```javascript
// Ensure all team objects have these fields
Object.values(teams).forEach(team => {
  if (!team.retentionSubmitted) team.retentionSubmitted = false;
  if (!team.retentionBudgetUsed) team.retentionBudgetUsed = 0;
  if (!team.trades) team.trades = [];
});
```

### 3.2 Player Object Extensions
- [ ] Add `player.IsRetained` boolean field
- [ ] Add `player.RetainedPrice` number field (if retained)
- [ ] Add `player.RetainedBy` string field (team name)

---

## Phase 4: Backend API Integration (Optional)

### 4.1 Create Homepage Endpoints
- [ ] GET `/api/league/status` - Current phase and stats
- [ ] GET `/api/league/homepage?phase=retention|trading|auction` - Phase data
- [ ] POST `/api/league/retention/submit` - Submit retentions
- [ ] POST `/api/league/trading/propose` - Propose trade
- [ ] PUT `/api/league/trading/approve` - Approve trade
- [ ] POST `/api/league/phase/advance` - Move to next phase (admin only)

### 4.2 Database Schema (if needed)
- [ ] Add `league_phases` table
- [ ] Add `retention_submissions` table
- [ ] Add `trades` table
- [ ] Add `phase_events` table for audit trail

---

## Phase 5: Component Testing

### 5.1 PhaseStepper Testing
- [ ] [ ] Test with phase='retention'
- [ ] [ ] Test with phase='trading'
- [ ] [ ] Test with phase='auction'
- [ ] [ ] Test with completedPhases=['retention']
- [ ] [ ] Test responsive layout (mobile/tablet/desktop)
- [ ] [ ] Verify animations don't lag
- [ ] [ ] Check accessibility (keyboard nav, screen readers)

### 5.2 DynamicStatusCard Testing
- [ ] [ ] Test with retention phase - verify counters
- [ ] [ ] Test with trading phase - verify pending approvals highlight
- [ ] [ ] Test with auction phase - verify progress bar
- [ ] [ ] Test countdown timer accuracy
- [ ] [ ] Test with no deadline (null values)
- [ ] [ ] Test with expired deadline
- [ ] [ ] Test color transitions between phases

### 5.3 TeamSnapshot Testing
- [ ] [ ] Test with empty teams array
- [ ] [ ] Test with multiple teams (4+)
- [ ] [ ] Test team logo display fallbacks
- [ ] [ ] Test retained players badges (max 3 shown)
- [ ] [ ] Test budget progress bar animation
- [ ] [ ] Test role distribution grid
- [ ] [ ] Test responsive grid layout

### 5.4 TransparencyFeed Testing
- [ ] [ ] Test with retention events
- [ ] [ ] Test with trading events
- [ ] [ ] Test with auction history
- [ ] [ ] Test with empty events array
- [ ] [ ] Test animation timings
- [ ] [ ] Test "Load More" button
- [ ] [ ] Test emoji display consistency

### 5.5 HomePageEnhanced Testing
- [ ] [ ] Test pre-auction view (not started)
- [ ] [ ] Test live auction view (started)
- [ ] [ ] Test tab switching (overview/teams/progress/leaderboard)
- [ ] [ ] Test all navigation buttons
- [ ] [ ] Test view transitions
- [ ] [ ] Test mobile responsiveness
- [ ] [ ] Test performance with large datasets

---

## Phase 6: Data Flow Testing

### 6.1 Sample Test Data
- [ ] Create test data file with sample teams/players
- [ ] Add retention events (5-10 examples)
- [ ] Add trading events (5-10 examples)
- [ ] Test with incomplete data
- [ ] Test with edge cases (empty, max, min values)

### 6.2 State Management Testing
- [ ] [ ] Test phase transition from retention → trading
- [ ] [ ] Test phase transition from trading → auction
- [ ] [ ] Test auto-update on new events
- [ ] [ ] Test retention deadline countdown
- [ ] [ ] Test trading deadline countdown
- [ ] [ ] Test stats recalculation on data change

---

## Phase 7: Styling & Visual Polish

### 7.1 Color & Theme
- [ ] [ ] Verify retention phase colors (red/orange)
- [ ] [ ] Verify trading phase colors (blue/cyan)
- [ ] [ ] Verify auction phase colors (green/emerald)
- [ ] [ ] Check gradient consistency
- [ ] [ ] Test dark mode compatibility (if applicable)

### 7.2 Typography & Icons
- [ ] [ ] Verify all icons load correctly
- [ ] [ ] Check emoji rendering across browsers
- [ ] [ ] Test font sizes at different breakpoints
- [ ] [ ] Verify contrast ratios (WCAG AA minimum)

### 7.3 Animations
- [ ] [ ] Test phase stepper pulse animation
- [ ] [ ] Test card entrance animations
- [ ] [ ] Test countdown number updates
- [ ] [ ] Check for animation lag on mobile
- [ ] [ ] Verify animation performance (GPU acceleration)

---

## Phase 8: Cross-Browser Testing

- [ ] [ ] Chrome (latest)
- [ ] [ ] Firefox (latest)
- [ ] [ ] Safari (latest)
- [ ] [ ] Edge (latest)
- [ ] [ ] Mobile Safari (iOS)
- [ ] [ ] Chrome Mobile (Android)

---

## Phase 9: Accessibility Testing

- [ ] [ ] Keyboard navigation works
- [ ] [ ] Screen reader announces phases correctly
- [ ] [ ] Color contrast meets WCAG AA
- [ ] [ ] Focus indicators visible
- [ ] [ ] Alt text for images
- [ ] [ ] Semantic HTML structure

---

## Phase 10: Performance Optimization

- [ ] [ ] Measure component render times
- [ ] [ ] Check bundle size impact
- [ ] [ ] Optimize image sizes
- [ ] [ ] Lazy load components if needed
- [ ] [ ] Test with throttled network
- [ ] [ ] Profile memory usage

**Performance Targets:**
- Component FCP: < 1s
- TTI: < 2s
- LCP: < 2.5s
- CLS: < 0.1

---

## Phase 11: Documentation

### 11.1 Code Documentation
- [ ] Add JSDoc comments to all components
- [ ] Document prop types and usage
- [ ] Add inline comments for complex logic
- [ ] Document event structures

### 11.2 User Documentation
- [ ] Create user guide for retention phase
- [ ] Create user guide for trading phase
- [ ] Create FAQ document
- [ ] Add screenshots to guides

### 11.3 Developer Documentation
- [ ] Add component usage examples
- [ ] Document data flow diagram
- [ ] Add troubleshooting guide
- [ ] Document API endpoints

---

## Phase 12: Admin Features

### 12.1 Admin Dashboard Updates
- [ ] Add phase management controls
- [ ] Add deadline setter UI
- [ ] Add manual phase transition button
- [ ] Add event logger/viewer
- [ ] Add statistics export

### 12.2 Admin Actions
- [ ] Start retention phase
- [ ] Set retention deadline
- [ ] Advance to trading phase
- [ ] Set trading deadline
- [ ] Approve/reject trades
- [ ] Advance to auction phase
- [ ] Reset league state

---

## Phase 13: Deployment

### 13.1 Pre-Deployment Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] No console warnings (except expected)
- [ ] Performance meets targets
- [ ] Security review passed
- [ ] Accessibility audit passed

### 13.2 Deployment Steps
- [ ] Build production bundle
- [ ] Test on staging environment
- [ ] Load testing (concurrent users)
- [ ] Database migrations (if any)
- [ ] Cache invalidation strategy
- [ ] Rollback plan ready

### 13.3 Post-Deployment
- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Gather user feedback
- [ ] Performance monitoring
- [ ] Security monitoring

---

## Phase 14: Post-Launch Improvements

### 14.1 User Feedback
- [ ] Collect user feedback
- [ ] Monitor support tickets
- [ ] Track usage patterns
- [ ] Identify pain points

### 14.2 Analytics
- [ ] Track phase interactions
- [ ] Monitor retention completion rate
- [ ] Monitor trading activity
- [ ] Track auction metrics

### 14.3 Future Enhancements
- [ ] Implement suggested features
- [ ] Optimize based on feedback
- [ ] Add new phase capabilities
- [ ] Improve notifications

---

## Bug Tracking

### Critical Issues
- [ ] None currently

### High Priority
- [ ] None currently

### Medium Priority
- [ ] None currently

### Low Priority
- [ ] None currently

---

## Notes

### Development Notes
- Components use Tailwind CSS for styling
- Animations powered by Framer Motion
- All times in UTC ISO 8601 format
- Component tests should use React Testing Library

### Integration Points
- `App.js` needs phase state management
- `AdminPage.js` needs phase controls
- `supabaseService.js` may need phase tables
- Backend API endpoints may be needed

### Fallback Strategies
- If API fails, use cached data
- If countdown timer fails, show static deadline text
- If events fail to load, show "No activity" message
- If teams fail to load, show initialization prompt

---

## Status Summary

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Setup & Files | ✅ Complete | All new files created |
| 2. Integration | ⏳ Pending | Needs App.js updates |
| 3. Data Model | ⏳ Pending | Needs backend coordination |
| 4. Backend API | ⏳ Optional | Can use mock data for now |
| 5. Component Tests | ⏳ Pending | Manual testing required |
| 6. Data Flow | ⏳ Pending | Needs test data |
| 7. Styling | ✅ Complete | All styles in components |
| 8. Cross-Browser | ⏳ Pending | Testing needed |
| 9. Accessibility | ⏳ Pending | Audit needed |
| 10. Performance | ⏳ Pending | Optimization pass needed |
| 11. Documentation | ✅ Complete | Guide + API samples done |
| 12. Admin Features | ⏳ Pending | Design needed |
| 13. Deployment | ⏳ Pending | Post-integration |
| 14. Post-Launch | ⏳ Pending | Future phase |

---

## Quick Start for Testing

1. Copy all new component files to `src/components/`
2. Copy `leaguePhaseUtils.js` to `src/utils/`
3. Update `App.js` with phase state and props
4. Set `leaguePhase="retention"` for testing
5. Pass sample team/event data
6. Run `npm start` and test locally

---

## Questions & Troubleshooting

**Q: How do I test with mock data?**
A: Create sample objects matching the API response format in HOMEPAGE_API_SAMPLE.md

**Q: Do I need a backend API?**
A: Not initially - use mock data. Backend APIs can be added later.

**Q: How do I transition between phases?**
A: Currently manual through `setLeaguePhase()`. Admin controls coming in Phase 12.

**Q: Why HomePageEnhanced instead of updating HomePage?**
A: Preserves original HomePage for reference and allows gradual migration.

**Q: Can I reuse the original HomePage?**
A: Yes, just don't pass leaguePhase prop to use original auction-only view.

