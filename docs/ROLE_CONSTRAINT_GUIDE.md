# Player Role Constraint Guide

## 🎯 Database Role Constraint

The `players` table has a **CHECK constraint** on the `role` column that only allows these exact values:

```sql
CHECK (role IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper'))
```

## ✅ **Valid Role Values**

When inserting your real player data, you **MUST** use exactly these values:

| Role | Exact Value | Case Sensitive |
|------|-------------|----------------|
| 🏏 Batsmen | `'Batsman'` | ✅ Exact match required |
| 🎯 Bowlers | `'Bowler'` | ✅ Exact match required |
| ⚡ All-rounders | `'All-rounder'` | ✅ Note the hyphen |
| 🧤 Wicketkeepers | `'WicketKeeper'` | ✅ CamelCase, no space |

## ❌ **Common Mistakes to Avoid**

### **Incorrect Values That Will Fail:**
```sql
-- These will cause constraint violation errors:
'batsman'           -- lowercase
'BATSMAN'           -- uppercase  
'Batsmen'           -- plural
'bowler'            -- lowercase
'BOWLER'            -- uppercase
'Bowlers'           -- plural
'all-rounder'       -- lowercase
'All-Rounder'       -- different case
'All Rounder'       -- space instead of hyphen
'allrounder'        -- no hyphen
'wicketkeeper'      -- lowercase
'Wicket Keeper'     -- space
'WicketKeepers'     -- plural
'Keeper'            -- shortened
```

### **Correct Values:**
```sql
-- These are the ONLY valid values:
'Batsman'           ✅
'Bowler'            ✅  
'All-rounder'       ✅
'WicketKeeper'      ✅
```

## 🔧 **Handling Role Constraint Issues**

### **If You Need Different Role Names:**

#### **Option 1: Update the Constraint (Recommended)**
```sql
-- Remove existing constraint
ALTER TABLE players DROP CONSTRAINT players_role_check;

-- Add new constraint with your preferred values
ALTER TABLE players ADD CONSTRAINT players_role_check 
CHECK (role IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper', 'YourCustomRole'));
```

#### **Option 2: Map Your Data to Existing Values**
If your data uses different role names, map them to the valid values:

```sql
-- Example mapping during data insertion
INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) 
SELECT 
  player_id,
  name,
  CASE 
    WHEN your_role = 'Batting' THEN 'Batsman'
    WHEN your_role = 'Bowling' THEN 'Bowler'  
    WHEN your_role = 'AllRounder' THEN 'All-rounder'
    WHEN your_role = 'Keeper' THEN 'WicketKeeper'
    ELSE your_role
  END as role,
  base_tokens,
  photo_filename,
  department,
  status
FROM your_temp_table;
```

## 🛠️ **Validation Queries**

### **Check for Invalid Roles Before Insert:**
```sql
-- Run this on your data before inserting
SELECT DISTINCT role 
FROM your_data_table 
WHERE role NOT IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper');
```

### **Validate Existing Data:**
```sql
-- Check current players table for any invalid roles
SELECT DISTINCT role 
FROM players 
WHERE role NOT IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper');
```

### **Count Players by Role:**
```sql
-- Verify role distribution
SELECT role, COUNT(*) as player_count 
FROM players 
GROUP BY role 
ORDER BY role;
```

## 📝 **Updated Data Templates**

### **Correct INSERT Statements:**
```sql
-- Batsmen
INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES
('P001', 'Player Name', 'Batsman', 45, 'player1.jpg', 'Batting', 'Available');

-- Bowlers
INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES
('P002', 'Player Name', 'Bowler', 40, 'player2.jpg', 'Bowling', 'Available');

-- All-rounders (note the hyphen!)
INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES
('P003', 'Player Name', 'All-rounder', 55, 'player3.jpg', 'All-rounder', 'Available');

-- Wicketkeepers (note the CamelCase!)
INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES
('P004', 'Player Name', 'WicketKeeper', 35, 'player4.jpg', 'Wicket Keeping', 'Available');
```

## 🚨 **Error Handling**

### **If You Get Constraint Violation Error:**
```
ERROR: new row for relation "players" violates check constraint "players_role_check"
```

**Solution Steps:**
1. Check the exact role value you're trying to insert
2. Compare with the valid values list above
3. Fix the case sensitivity and spelling
4. Re-run the INSERT statement

### **Bulk Data Correction:**
```sql
-- If you have data with incorrect roles, fix them:
UPDATE players SET role = 'Batsman' WHERE role IN ('batsman', 'Batsmen', 'BATSMAN');
UPDATE players SET role = 'Bowler' WHERE role IN ('bowler', 'Bowlers', 'BOWLER');
UPDATE players SET role = 'All-rounder' WHERE role IN ('all-rounder', 'All-Rounder', 'AllRounder');
UPDATE players SET role = 'WicketKeeper' WHERE role IN ('wicketkeeper', 'Wicket Keeper', 'Keeper');
```

## 🎯 **Best Practices**

### **1. Validate Before Insert:**
Always check your data against the constraint before inserting:
```sql
-- Create a validation function
CREATE OR REPLACE FUNCTION validate_player_role(role_value TEXT) 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN role_value IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper');
END;
$$ LANGUAGE plpgsql;

-- Use in validation
SELECT name, role, validate_player_role(role) as is_valid 
FROM your_temp_data 
WHERE NOT validate_player_role(role);
```

### **2. Use Constants in Code:**
In your application code, use constants to avoid typos:
```javascript
const PLAYER_ROLES = {
  BATSMAN: 'Batsman',
  BOWLER: 'Bowler', 
  ALL_ROUNDER: 'All-rounder',
  WICKET_KEEPER: 'WicketKeeper'
};
```

### **3. Frontend Validation:**
Ensure your forms only allow valid role values:
```javascript
const validRoles = ['Batsman', 'Bowler', 'All-rounder', 'WicketKeeper'];
```

## 🔄 **Migration Script for Existing Data**

If you have existing data with different role formats:

```sql
-- Backup existing data first
CREATE TABLE players_backup AS SELECT * FROM players;

-- Update roles to match constraint
UPDATE players SET role = 
  CASE 
    WHEN LOWER(role) LIKE '%bat%' THEN 'Batsman'
    WHEN LOWER(role) LIKE '%bowl%' THEN 'Bowler'
    WHEN LOWER(role) LIKE '%all%' OR LOWER(role) LIKE '%round%' THEN 'All-rounder'
    WHEN LOWER(role) LIKE '%keep%' OR LOWER(role) LIKE '%wicket%' THEN 'WicketKeeper'
    ELSE role
  END
WHERE role NOT IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper');

-- Verify the update
SELECT role, COUNT(*) FROM players GROUP BY role;
```

Remember: The constraint ensures data consistency across your entire auction system! 🎯