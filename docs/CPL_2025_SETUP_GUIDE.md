# CPL 2025 Auction Setup Guide

## ✅ **Data Processing Complete!**

Your Colruyt Premier League Registrations 2025 data has been successfully processed and is ready for the auction system.

## 📊 **What Was Processed:**

### **Players for Auction: 94 players**
- **All-rounders**: 42 players (45%)
- **Batsmen**: 34 players (36%)
- **Wicketkeepers**: 14 players (15%)
- **Bowlers**: 4 players (4%)

### **Captains for Direct Assignment: 23 captains**
- **All-rounders**: 17 captains
- **Wicketkeepers**: 4 captains
- **Batsmen**: 2 captains

### **Total Participants: 117 players**

## 📁 **Generated Files:**

### **1. CPL_Auction_Data_2025.xlsx** (in assets folder)
**Purpose**: Main auction data file
**Sheets**:
- **Players**: 94 players ready for auction bidding
- **Captains**: 23 captains for direct team assignment
- **Complete_Data**: All 117 participants with full details

### **2. cpl_auction_2025_insert.sql**
**Purpose**: SQL statements to insert data into Supabase
**Contains**:
- INSERT statements for all 94 auction players
- Captain data as comments for reference
- Verification queries

### **3. captain_team_assignments.xlsx**
**Purpose**: Template for assigning captains to teams
**Structure**:
- **Teams sheet**: 8 teams with Captain/Vice-Captain slots
- **Available_Captains sheet**: List of 23 captains to assign

## 🎯 **Setup Process:**

### **Step 1: Assign Captains to Teams**

1. Open `captain_team_assignments.xlsx`
2. In the **Teams** sheet, assign captains:
   - Fill in **Captain** column with captain names
   - Fill in **ViceCaptain** column with vice-captain names
   - Update **TeamName** if needed
3. Save the file

**Captain/Vice-Captain Strategy:**
- Form pairs from the 23 available captains
- Consider role balance (mix All-rounders with other roles)
- Each team gets 1 Captain + 1 Vice-Captain = 2 pre-assigned players
- Remaining 7 teams will have 1 captain each (23 captains / 8 teams ≈ 3 per team)

### **Step 2: Clear Sample Data from Supabase**

```sql
-- Run in Supabase SQL Editor
DELETE FROM auction_history;
DELETE FROM players;
DELETE FROM teams;
```

### **Step 3: Insert Your Real Data**

#### **A. Insert Teams (with assigned captains)**
After assigning captains in the Excel file, create team INSERT statements:

```sql
INSERT INTO teams (team_id, team_name, logo_file, tokens_left, max_tokens, max_squad_size, batsman_budget, bowler_budget, allrounder_budget, wicketkeeper_budget) VALUES
('CPL_T01', 'Team 1', 'team1_logo.png', 1200, 1200, 15, 420, 420, 240, 120),
('CPL_T02', 'Team 2', 'team2_logo.png', 1200, 1200, 15, 420, 420, 240, 120),
-- Add all 8 teams
;
```

#### **B. Insert Auction Players**
```sql
-- Copy and paste contents of cpl_auction_2025_insert.sql
-- This will insert all 94 players for auction
```

#### **C. Manually Assign Captains to Teams**
After captains are assigned, update their status:

```sql
-- Example: Assign captain to Team 1
UPDATE players 
SET status = 'Sold', 
    sold_to = 'Team 1', 
    sold_price = 0  -- Captains are pre-assigned, no auction cost
WHERE player_id = 'CAPTAIN_ID_HERE';
```

### **Step 4: Upload Player Photos**

Generate placeholder photos or upload actual photos to `assets/images/`:
- Format: `firstname_lastname.jpg`
- Example: `abishai_narla.jpg`, `adithya_penmetcha.jpg`
- Size: 200x200px recommended

### **Step 5: Load Data in Your App**

1. Go to **Admin Panel** (password: `cpl2025admin`)
2. Click **"Load from Database"**
3. Verify all 94 players are loaded
4. Check that captains are already assigned to teams
5. Start the auction!

## 🎪 **Auction Flow:**

### **Pre-Auction:**
1. ✅ 23 Captains already assigned to 8 teams (2-3 per team)
2. ✅ Teams have reduced budgets after captain assignments
3. ✅ 94 players ready for competitive bidding

### **During Auction:**
1. **Phase 1**: Batsmen (34 players)
2. **Phase 2**: Bowlers (4 players) - Quick phase!
3. **Phase 3**: All-rounders (42 players) - Longest phase
4. **Phase 4**: Wicketkeepers (14 players)

### **Post-Auction:**
- Each team should have 13-15 players total
- 2-3 pre-assigned captains + 10-12 auctioned players

## 📊 **Role Mapping Logic:**

The script automatically mapped player roles:

| Original Role | Mapped To | Logic |
|---------------|-----------|-------|
| Wicket Keeper | WicketKeeper | Direct match |
| Batting All-rounder | All-rounder | Contains "batting all" |
| Bowling All-rounder | All-rounder | Contains "bowling all" |
| Batsman | Batsman | Direct match |
| Bowler | Bowler | Direct match |
| Fielder | Batsman | Default for fielders |

## 💰 **Base Token Strategy:**

### **Current Distribution:**
- **Range**: 35-40 tokens per player
- **Average**: 37.2 tokens
- **Captains**: Premium pricing (top of range)
- **Regular Players**: Mid-range pricing

### **Recommended Adjustments:**
You may want to adjust base tokens based on:
- Player experience/skill level
- Department/seniority
- Previous tournament performance
- Market demand for specific roles

Use the **Player Valuation Calculator** in Admin Panel to recalculate if needed.

## ⚠️ **Important Notes:**

### **Captain Assignment:**
- Captains are NOT in the auction pool
- They are pre-assigned to teams before auction starts
- This ensures each team has leadership
- Reduces auction complexity

### **Role Distribution:**
- **Heavy on All-rounders** (42 players) - Great flexibility!
- **Light on Bowlers** (4 players) - Will be highly competitive
- **Good balance** of Batsmen and Wicketkeepers

### **Budget Implications:**
- Teams start with 1200 tokens
- After captain assignments (0 cost), full budget available
- Category budgets: 420+420+240+120 = 1200 tokens

## 🔧 **Customization Options:**

### **Adjust Base Tokens:**
Edit the generated Excel file before importing, or use SQL:
```sql
UPDATE players SET base_tokens = 50 WHERE role = 'Bowler';  -- Increase bowler value
```

### **Change Team Count:**
Edit `captain_team_assignments.xlsx` to add/remove teams

### **Modify Category Budgets:**
Adjust in `src/utils/auctionUtils.js` if needed

## 🎉 **You're Ready!**

Your CPL 2025 auction system is now configured with:
- ✅ 94 real players for auction
- ✅ 23 captains for team assignment
- ✅ Database-compliant role mapping
- ✅ Optimized base token distribution
- ✅ Complete audit trail with employee IDs

Let the bidding begin! 🏏🏆