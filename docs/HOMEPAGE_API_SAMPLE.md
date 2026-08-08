# Homepage API Sample Responses

## Overview
Sample JSON responses showing the data structure needed for the redesigned homepage with phase support.

---

## 1. Retention Phase Response

```json
{
  "success": true,
  "phase": "retention",
  "timestamp": "2025-01-10T14:30:00Z",
  "retentionDeadline": "2025-01-15T18:00:00Z",
  
  "retentionStats": {
    "teamsSubmitted": 5,
    "teamsTotal": 8,
    "totalPlayersRetained": 45,
    "averagePlayersPerTeam": 5.6,
    "totalPurseRemaining": 2400,
    "purseUsedForRetention": 7800
  },

  "teams": {
    "CSK": {
      "id": "CPL_T01",
      "name": "Colruyt Super Kings",
      "logo": "csk.png",
      "maxTokens": 1200,
      "tokensLeft": 300,
      "retentionSubmitted": true,
      "retentionBudgetUsed": 900,
      
      "squad": [
        {
          "PlayerID": "14HB",
          "Name": "MS Dhoni",
          "Role": "WicketKeeper",
          "BaseTokens": 150,
          "IsRetained": true,
          "RetainedPrice": 300,
          "RetainedBy": "CSK"
        },
        {
          "PlayerID": "1P0T",
          "Name": "Ruturaj Gaikwad",
          "Role": "Batsman",
          "BaseTokens": 100,
          "IsRetained": true,
          "RetainedPrice": 200
        },
        {
          "PlayerID": "5E6D",
          "Name": "Bharath Koyya",
          "Role": "Batsman",
          "BaseTokens": 80,
          "IsRetained": false
        }
      ],
      
      "retainedPlayers": [
        {
          "PlayerID": "14HB",
          "Name": "MS Dhoni",
          "Role": "WicketKeeper",
          "RetainedPrice": 300
        },
        {
          "PlayerID": "1P0T",
          "Name": "Ruturaj Gaikwad",
          "Role": "Batsman",
          "RetainedPrice": 200
        }
      ],
      
      "roleCount": {
        "Batsman": 3,
        "Bowler": 2,
        "WicketKeeper": 1,
        "All-rounder": 1
      }
    },
    
    "RCB": {
      "id": "CPL_T02",
      "name": "Mavericks",
      "logo": "Mavericks.png",
      "maxTokens": 1200,
      "tokensLeft": 450,
      "retentionSubmitted": true,
      "retentionBudgetUsed": 750,
      "squad": [...],
      "roleCount": {...}
    },
    
    "MI": {
      "id": "CPL_T03",
      "name": "Digi Titans",
      "logo": "digititans.png",
      "maxTokens": 1200,
      "tokensLeft": 1200,
      "retentionSubmitted": false,  // NOT SUBMITTED
      "retentionBudgetUsed": 0,
      "squad": [],
      "roleCount": {
        "Batsman": 0,
        "Bowler": 0,
        "WicketKeeper": 0,
        "All-rounder": 0
      }
    }
  },

  "retentionEvents": [
    {
      "id": "ret-1",
      "teamName": "CSK",
      "playerName": "MS Dhoni",
      "playerID": "14HB",
      "price": 300,
      "timestamp": "2025-01-10T10:15:00Z",
      "message": "CSK retained MS Dhoni for 300 tokens"
    },
    {
      "id": "ret-2",
      "teamName": "CSK",
      "playerName": "Ruturaj Gaikwad",
      "playerID": "1P0T",
      "price": 200,
      "timestamp": "2025-01-10T10:20:00Z",
      "message": "CSK retained Ruturaj Gaikwad for 200 tokens"
    },
    {
      "id": "ret-3",
      "teamName": "RCB",
      "playerName": "Virat Kohli",
      "playerID": "2BJB",
      "price": 250,
      "timestamp": "2025-01-10T11:05:00Z",
      "message": "RCB retained Virat Kohli for 250 tokens"
    }
  ],

  "players": [
    {
      "PlayerID": "14HB",
      "Name": "MS Dhoni",
      "Role": "WicketKeeper",
      "BaseTokens": 150,
      "PhotoFileName": "14HB.jpg",
      "Status": "Retained",
      "SoldTo": "CSK"
    }
  ]
}
```

---

## 2. Trading Phase Response

```json
{
  "success": true,
  "phase": "trading",
  "timestamp": "2025-01-16T14:30:00Z",
  "tradingDeadline": "2025-01-20T18:00:00Z",

  "tradingStats": {
    "totalTrades": 12,
    "pendingApprovals": 2,
    "approvedTrades": 8,
    "completedTrades": 8,
    "mostActiveTeam": "CSK",
    "mostActiveTeamTrades": 4
  },

  "teams": {
    "CSK": {
      "id": "CPL_T01",
      "name": "Colruyt Super Kings",
      "logo": "csk.png",
      "maxTokens": 1200,
      "tokensLeft": 300,
      
      "squad": [
        {
          "PlayerID": "14HB",
          "Name": "MS Dhoni",
          "Role": "WicketKeeper",
          "IsRetained": true
        },
        {
          "PlayerID": "1P0T",
          "Name": "Ruturaj Gaikwad",
          "Role": "Batsman",
          "IsRetained": true
        }
      ],

      "trades": [
        {
          "id": "trade-1",
          "playerID": "5E6D",
          "playerName": "Bharath Koyya",
          "fromTeam": "CSK",
          "toTeam": "RCB",
          "compensation": "Player X",
          "status": "completed",
          "timestamp": "2025-01-16T10:30:00Z",
          "approvedBy": "both"
        },
        {
          "id": "trade-2",
          "playerID": "836I",
          "playerName": "Haniel Nissi Medari",
          "fromTeam": "MI",
          "toTeam": "CSK",
          "compensation": "Player Y",
          "status": "pending",  // AWAITING APPROVAL
          "proposedBy": "MI",
          "timestamp": "2025-01-16T14:15:00Z"
        }
      ],

      "roleCount": {
        "Batsman": 3,
        "Bowler": 2,
        "WicketKeeper": 1,
        "All-rounder": 1
      }
    },

    "RCB": {
      "id": "CPL_T02",
      "name": "Mavericks",
      "logo": "Mavericks.png",
      "maxTokens": 1200,
      "tokensLeft": 450,
      "trades": [
        {
          "id": "trade-1",
          "playerID": "5E6D",
          "playerName": "Bharath Koyya",
          "fromTeam": "CSK",
          "toTeam": "RCB",
          "compensation": "Player X",
          "status": "completed",
          "timestamp": "2025-01-16T10:30:00Z"
        }
      ]
    }
  },

  "tradingEvents": [
    {
      "id": "trade-1",
      "fromTeam": "CSK",
      "toTeam": "RCB",
      "playerName": "Bharath Koyya",
      "playerID": "5E6D",
      "compensation": "Haniel Nissi Medari",
      "status": "completed",
      "timestamp": "2025-01-16T10:30:00Z",
      "message": "CSK traded Bharath Koyya to RCB"
    },
    {
      "id": "trade-2",
      "fromTeam": "RCB",
      "toTeam": "MI",
      "playerName": "Test Player",
      "playerID": "ABC123",
      "compensation": "Another Player",
      "status": "pending",
      "timestamp": "2025-01-16T13:45:00Z",
      "message": "RCB proposed trade - awaiting approval"
    }
  ]
}
```

---

## 3. Auction Phase Response (Existing + Enhanced)

```json
{
  "success": true,
  "phase": "auction",
  "timestamp": "2025-01-21T14:30:00Z",
  "auctionStarted": true,
  "auctionStartTime": "2025-01-21T10:00:00Z",

  "auctionStats": {
    "total": 122,
    "processed": 85,
    "sold": 78,
    "unsold": 7
  },

  "players": [
    {
      "PlayerID": "46TH",
      "Name": "Hari Prasanna Raju Chennamadhava",
      "Role": "Batsman",
      "BaseTokens": 100,
      "PhotoFileName": "46TH.jpg",
      "Status": "Sold",
      "SoldTo": "CSK",
      "SoldPrice": 120,
      "AuctionOrder": 1
    },
    {
      "PlayerID": "8XYH",
      "Name": "Bhuwan Vamsi Tamma",
      "Role": "Bowler",
      "BaseTokens": 80,
      "PhotoFileName": "8XYH.jpg",
      "Status": "Available",
      "SoldTo": null,
      "SoldPrice": 0,
      "AuctionOrder": 2
    }
  ],

  "auctionHistory": [
    {
      "Player": "Hari Prasanna Raju Chennamadhava",
      "Role": "Batsman",
      "BaseTokens": 100,
      "SoldPrice": 120,
      "Team": "CSK",
      "TokensLeft": 280,
      "SquadSize": 10,
      "CategoryBudgetRemaining": 220,
      "timestamp": "2025-01-21T10:15:00Z"
    },
    {
      "Player": "Another Player",
      "Role": "All-rounder",
      "BaseTokens": 90,
      "SoldPrice": 110,
      "Team": "RCB",
      "TokensLeft": 340,
      "SquadSize": 9,
      "CategoryBudgetRemaining": 130,
      "timestamp": "2025-01-21T10:30:00Z"
    }
  ],

  "unsoldPlayers": [
    {
      "PlayerID": "999XX",
      "Name": "Lesser Known Player",
      "Role": "Bowler",
      "BaseTokens": 50
    }
  ],

  "teams": {
    "CSK": {
      "id": "CPL_T01",
      "name": "Colruyt Super Kings",
      "logo": "csk.png",
      "maxTokens": 1200,
      "tokensLeft": 280,
      "squad": [
        {
          "PlayerID": "14HB",
          "Name": "MS Dhoni",
          "Role": "WicketKeeper",
          "IsRetained": true,
          "BidPrice": 300
        },
        {
          "PlayerID": "46TH",
          "Name": "Hari Prasanna",
          "Role": "Batsman",
          "BidPrice": 120
        }
      ],
      "roleCount": {
        "Batsman": 4,
        "Bowler": 3,
        "WicketKeeper": 2,
        "All-rounder": 1
      },
      "categoryBudgets": {
        "Batsman": {
          "spent": 280,
          "remaining": 70,
          "min": 250,
          "max": 350
        },
        "Bowler": {
          "spent": 150,
          "remaining": 150,
          "min": 200,
          "max": 300
        },
        "All-rounder": {
          "spent": 100,
          "remaining": 100,
          "min": 200,
          "max": 350
        },
        "WicketKeeper": {
          "spent": 300,
          "remaining": 0,
          "min": 100,
          "max": 200
        }
      }
    }
  }
}
```

---

## 4. Between-Phase Transition Response

```json
{
  "success": true,
  "currentPhase": "retention",
  "nextPhase": "trading",
  "phaseTransition": {
    "message": "Retention phase ending in 2 hours",
    "timeToTransition": "02:00:00",
    "automaticTransition": true
  },
  
  "finalRetentionStats": {
    "teamsSubmitted": 8,
    "teamsTotal": 8,
    "totalPlayersRetained": 48,
    "totalPurseRemaining": 2100
  },

  "readyForTrading": {
    "playersAvailable": 74,
    "teamsReady": 8,
    "status": "ready"
  }
}
```

---

## 5. Empty State Response (Not Initialized)

```json
{
  "success": true,
  "phase": "retention",
  "initialized": false,
  
  "message": "League not yet initialized",
  "requiredSetup": [
    "Load teams from Excel",
    "Load players from Excel",
    "Set retention deadline",
    "Initialize phase system"
  ],

  "teams": {},
  "players": [],
  "retentionStats": {
    "teamsSubmitted": 0,
    "teamsTotal": 0,
    "totalPlayersRetained": 0,
    "totalPurseRemaining": 0,
    "purseUsedForRetention": 0
  }
}
```

---

## 6. Sample Frontend Integration

```javascript
// Fetch homepage data
async function loadHomepageData(phase = 'retention') {
  const response = await fetch(`/api/league/homepage?phase=${phase}`);
  const data = await response.json();
  
  return {
    phase: data.phase,
    stats: phase === 'retention' 
      ? data.retentionStats
      : phase === 'trading'
      ? data.tradingStats
      : data.auctionStats,
    teams: data.teams,
    events: phase === 'retention'
      ? data.retentionEvents
      : phase === 'trading'
      ? data.tradingEvents
      : data.auctionHistory,
    deadline: phase === 'retention'
      ? data.retentionDeadline
      : data.tradingDeadline
  };
}

// Usage in component
const HomePageWrapper = () => {
  const [leaguePhase, setLeaguePhase] = useState('retention');
  const [homepageData, setHomepageData] = useState(null);

  useEffect(() => {
    loadHomepageData(leaguePhase).then(setHomepageData);
  }, [leaguePhase]);

  return (
    <HomePageEnhanced
      leaguePhase={leaguePhase}
      retentionDeadline={homepageData?.deadline}
      retentionStats={homepageData?.stats}
      retentionEvents={homepageData?.events}
      teams={homepageData?.teams}
      {...otherProps}
    />
  );
};
```

---

## 7. Data Flow Diagram

```
┌─────────────────────────────────┐
│  Homepage API Endpoint           │
│  /api/league/homepage?phase=X    │
└────────────┬────────────────────┘
             │
             ├─────────────────────────────┐
             │                             │
        Phase = ?                          │
             │                             │
    ┌────────┴──────────┬─────────┐       │
    │                   │         │       │
    ▼                   ▼         ▼       │
┌────────┐         ┌────────┐  ┌────┐    │
│Rotation│         │Trading │  │Auction  │
│Stats   │         │Stats   │  │Stats    │
└────────┘         └────────┘  └────┘    │
    │                   │         │       │
    │   ┌───────────────┼─────────┤       │
    │   │               │         │       │
    ▼   ▼               ▼         ▼       │
    ┌────────────────────────────────┐   │
    │  Component Props               │   │
    │  retentionStats                │   │
    │  tradingStats                  │   │
    │  auctionStats                  │   │
    │  retentionEvents               │   │
    │  tradingEvents                 │   │
    │  auctionHistory                │   │
    └────────────────────────────────┘   │
             │                           │
             ▼                           │
    ┌────────────────────┐               │
    │ HomePageEnhanced   │◄──────────────┘
    │ Renders view       │
    │ based on phase     │
    └────────────────────┘
```

---

## Notes

1. **API Endpoint**: Adjust `/api/league/homepage` to match your backend URL
2. **Polling**: Frontend should poll every 5 seconds during active phases
3. **Timestamps**: All timestamps are ISO 8601 format (UTC)
4. **Status**: Update component based on `phase` parameter
5. **Events**: Frontend filters and displays last 5 events per phase
6. **Empty States**: Handle missing data gracefully with fallbacks

