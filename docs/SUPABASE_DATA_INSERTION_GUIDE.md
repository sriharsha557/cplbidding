# Supabase Data Insertion Guide - CPL 2025

## 📊 **Your Current Table Structure**

Your `players` table has these columns:
- `id` (serial, auto-increment)
- `player_id` (varchar(20), unique) ✅
- `name` (varchar(100)) ✅
- `role` (varchar(20)) ✅ - Must be: Batsman, Bowler, All-rounder, WicketKeeper
- `department` (varchar(100)) ✅
- `base_tokens` (integer) ✅
- `photo_filename` (varchar(255)) ✅
- `status` (varchar(20)) ✅ - Default: 'Available'
- `sold_to` (varchar(10)) - Foreign key to teams
- `sold_price` (integer) - Default: 0
- `auction_order` (integer) ✅ - **Perfect for controlling auction sequence!**
- `created_at` (timestamp)
- `updated_at` (timestamp)

## ✅ **Generated Data Matches Your Structure!**

The processed CPL 2025 data includes all required fields:
- ✅ 94 players with unique `player_id`
- ✅ All roles are database-compliant
- ✅ `auction_order` set for category-based bidding
- ✅ `department` mapped correctly
- ✅ `status` set to 'Available'

## 🚀 **Step-by-Step Insertion Process**

### **Step 1: Backup Existing Data (Optional)**

If you want to keep your current data:

```sql
-- Run in Supabase SQL Editor
CREATE TABLE players_backup AS SELECT * FROM players;
CREATE TABLE teams_backup AS SELECT * FROM teams;
CREATE TABLE auction_history_backup AS SELECT * FROM auction_history;
```

### **Step 2: Clear Existing Data**

```sql
-- Clear in correct order (foreign key constraints)
DELETE FROM auction_history;
DELETE FROM players;
-- Optional: DELETE FROM teams;
```

### **Step 3: Reset Sequences**

```sql
ALTER SEQUENCE players_id_seq RESTART WITH 1;
ALTER SEQUENCE auction_history_id_seq RESTART WITH 1;
```

### **Step 4: Insert CPL 2025 Players**

**Option A: Use the Generated SQL File**
1. Open `cpl_auction_2025_insert.sql`
2. Copy the entire INSERT statement (all 94 players)
3. Paste into Supabase SQL Editor
4. Click "Run"

**Option B: Use the Master Script**
1. Open `insert_cpl_2025_data.sql`
2. Follow the step-by-step instructions in that file
3. Paste the generated INSERT from `cpl_auction_2025_insert.sql` into Step 6

### **Step 5: Verify Insertion**

```sql
-- Check total count
SELECT COUNT(*) as total_players FROM players;
-- Expected: 94

-- Check role distribution
SELECT 
  role,
  COUNT(*) as count,
  MIN(base_tokens) as min_tokens,
  MAX(base_tokens) as max_tokens
FROM players 
GROUP BY role 
ORDER BY role;

-- Expected:
-- All-rounder: 42
-- Batsman: 34
-- WicketKeeper: 14
-- Bowler: 4

-- Check auction order sequence
SELECT 
  role,
  MIN(auction_order) as first,
  MAX(auction_order) as last
FROM players
GROUP BY role
ORDER BY MIN(auction_order);

-- Expected order:
-- Batsman: 1000-1999
-- Bowler: 2000-2999
-- All-rounder: 3000-3999
-- WicketKeeper: 4000-4999
```

### **Step 6: Assign Captains to Teams (Before Auction)**

The 23 captains should be pre-assigned to teams:

```sql
-- Example: Assign captain to Team 1
UPDATE players 
SET 
  status = 'Sold', 
  sold_to = 'CPL_T01',  -- Your team_id
  sold_price = 0        -- Captains are pre-assigned, no cost
WHERE player_id = 'CAPTAIN_PLAYER_ID';

-- Repeat for all 23 captains
-- Use captain_team_assignments.xlsx to plan assignments
```

**Captain Assignment Strategy:**
- 8 teams × 2-3 captains each = 16-24 captains
- You have 23 captains - perfect fit!
- Assign 2-3 captains per team before auction
- This ensures leadership and reduces auction complexity

## 📋 **Captain Assignment Template**

Use `captain_team_assignments.xlsx` to plan, then execute:

```sql
-- Team 1 Captains
UPDATE players SET status = 'Sold', sold_to = 'CPL_T01', sold_price = 0 
WHERE player_id IN ('CAPTAIN1_ID', 'CAPTAIN2_ID');

-- Team 2 Captains
UPDATE players SET status = 'Sold', sold_to = 'CPL_T02', sold_price = 0 
WHERE player_id IN ('CAPTAIN3_ID', 'CAPTAIN4_ID');

-- ... repeat for all 8 teams
```

## 🎯 **Auction Order Explanation**

The `auction_order` field controls the bidding sequence:

| Role | Auction Order Range | Count | Phase |
|------|-------------------|-------|-------|
| **Batsman** | 1000-1999 | 34 | Phase 1 |
| **Bowler** | 2000-2999 | 4 | Phase 2 |
| **All-rounder** | 3000-3999 | 42 | Phase 3 |
| **WicketKeeper** | 4000-4999 | 14 | Phase 4 |

Your app will automatically:
1. Sort players by `auction_order`
2. Present them in category-based sequence
3. Show category progress indicators
4. Apply category budget validation

## ⚠️ **Important Checks**

### **Before Starting Auction:**

```sql
-- 1. Verify all players are loaded
SELECT COUNT(*) FROM players WHERE status = 'Available';
-- Should be: 94 - (number of captains assigned)

-- 2. Verify captains are assigned
SELECT COUNT(*) FROM players WHERE status = 'Sold' AND sold_price = 0;
-- Should be: 23 (or however many you assigned)

-- 3. Check for any issues
SELECT * FROM players WHERE auction_order IS NULL;
-- Should return: 0 rows

-- 4. Verify role constraints
SELECT DISTINCT role FROM players 
WHERE role NOT IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper');
-- Should return: 0 rows
```

## 🔧 **Troubleshooting**

### **Issue: Foreign Key Constraint Error**
```
ERROR: insert or update on table "players" violates foreign key constraint "players_sold_to_fkey"
```
**Solution**: Make sure teams exist before assigning captains
```sql
SELECT * FROM teams;  -- Verify teams exist
```

### **Issue: Role Check Constraint Error**
```
ERROR: new row for relation "players" violates check constraint "players_role_check"
```
**Solution**: All roles in generated SQL are correct. If you modified data, ensure exact values:
- `'Batsman'` (not 'batsman')
- `'Bowler'` (not 'bowler')
- `'All-rounder'` (with hyphen)
- `'WicketKeeper'` (CamelCase, no space)

### **Issue: Duplicate Player ID**
```
ERROR: duplicate key value violates unique constraint "players_player_id_key"
```
**Solution**: Clear existing data first (Step 2)

## 📊 **Data Quality Report**

After insertion, your database will have:

✅ **94 auction-ready players**
- All with unique player_ids
- All with valid roles
- All with auction_order set
- All with status = 'Available'

✅ **23 pre-assigned captains**
- Distributed across 8 teams
- Status = 'Sold', sold_price = 0
- Not in auction pool

✅ **Category-based auction flow**
- Batsmen → Bowlers → All-rounders → Wicketkeepers
- Controlled by auction_order field
- Budget validation per category

## 🎪 **Ready for Live Auction!**

Once data is inserted and captains assigned:
1. ✅ Load data in your auction app
2. ✅ Verify 94 players appear (minus assigned captains)
3. ✅ Check auction proceeds by category
4. ✅ Test bidding with category budgets
5. ✅ Start the live auction!

Your Supabase database is now perfectly configured for the CPL 2025 auction! 🏆