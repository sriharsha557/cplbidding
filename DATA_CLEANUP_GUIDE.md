# CPL Auction Data Cleanup Guide

## 🎯 Overview
This guide helps you remove sample data from Supabase and insert your actual CPL player and team data.

## 📋 Step-by-Step Process

### **Step 1: Backup Current Data (Optional)**
If you want to keep the sample data for reference:

```sql
-- Run in Supabase SQL Editor
CREATE TABLE teams_sample_backup AS SELECT * FROM teams;
CREATE TABLE players_sample_backup AS SELECT * FROM players;
CREATE TABLE auction_history_sample_backup AS SELECT * FROM auction_history;
```

### **Step 2: Clear Sample Data**

#### **Option A: Using Admin Panel (Recommended)**
1. Open your CPL auction app
2. Click "Admin Panel" in navigation
3. Enter admin password: `cpl2025admin`
4. Go to "Data Cleanup" tab
5. Click "Clear All Data" to remove everything
6. Confirm the action

#### **Option B: Using SQL Scripts**
Run the `prepare-for-real-data.sql` script in Supabase SQL Editor:

```sql
-- Clear all sample data
DELETE FROM auction_history;
DELETE FROM players;
DELETE FROM teams;

-- Reset sequences
ALTER SEQUENCE teams_id_seq RESTART WITH 1;
ALTER SEQUENCE players_id_seq RESTART WITH 1;
ALTER SEQUENCE auction_history_id_seq RESTART WITH 1;
```

### **Step 3: Verify Cleanup**
Run this query to confirm all data is cleared:

```sql
SELECT 
  'teams' as table_name, COUNT(*) as remaining_records FROM teams
UNION ALL
SELECT 
  'players' as table_name, COUNT(*) as remaining_records FROM players
UNION ALL
SELECT 
  'auction_history' as table_name, COUNT(*) as remaining_records FROM auction_history;
```

**Expected Result:** All counts should be 0.

### **Step 4: Prepare Your Real Data**

#### **Teams Data Format:**
```sql
INSERT INTO teams (team_id, team_name, logo_file, tokens_left, max_tokens, max_squad_size, batsman_budget, bowler_budget, allrounder_budget, wicketkeeper_budget) VALUES
('YOUR_T001', 'Your Team Name', 'team_logo.png', 1200, 1200, 15, 420, 420, 240, 120);
```

#### **Players Data Format:**
```sql
INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES
('YOUR_P001', 'Player Name', 'Batsman', 45, 'player_photo.jpg', 'Batting', 'Available');
```

### **Step 5: Set Base Prices Using Valuation Framework**

Use the **Player Valuation Calculator** in the Admin Panel:

#### **Recommended Base Token Ranges:**

| Role | Excellent | Good | Average | Below Average |
|------|-----------|------|---------|---------------|
| **Batsman** | 50-70 | 30-49 | 15-29 | 8-14 |
| **Bowler** | 45-65 | 25-44 | 12-24 | 6-11 |
| **All-rounder** | 60-80 | 35-59 | 20-34 | 10-19 |
| **WicketKeeper** | 40-60 | 22-39 | 12-21 | 5-11 |

#### **Factors to Consider:**
- **Performance Level** (40% weight) - Recent form and statistics
- **Experience** (25% weight) - International vs domestic vs emerging
- **Age Factor** (15% weight) - Peak age (24-30) vs young vs veteran
- **Market Demand** (15% weight) - Position scarcity and team needs
- **Special Skills** (5% weight) - Captain, specialist skills, local favorite

### **Step 6: Insert Your Real Data**

1. **Customize the template** in `insert-real-data-template.sql`
2. **Replace example data** with your actual teams and players
3. **Set appropriate base tokens** using the valuation framework
4. **Run the script** in Supabase SQL Editor
5. **Verify the data** using the validation queries

### **Step 7: Upload Media Files**

#### **Team Logos:**
- Place in `assets/images/` folder
- Format: PNG or JPG
- Recommended size: 200x200px
- Naming: `team_logo.png` (match logo_file in database)

#### **Player Photos:**
- Place in `assets/images/` folder  
- Format: PNG or JPG
- Recommended size: 200x200px
- Naming: `player_photo.jpg` (match photo_filename in database)

### **Step 8: Test Your Setup**

1. **Load data** in Admin Panel
2. **Start a test auction** with a few players
3. **Verify category-based bidding** works correctly
4. **Check team dashboards** show correct information
5. **Test public view** displays properly
6. **Reset auction** when ready for live event

## 🛠️ Available SQL Scripts

### **1. supabase-cleanup-scripts.sql**
- Complete data management toolkit
- Backup, cleanup, restore, and validation queries
- Sample data insertion for testing
- Comprehensive documentation

### **2. prepare-for-real-data.sql**
- Quick cleanup script for production
- Removes all sample data
- Resets sequences for clean IDs
- Verification queries included

### **3. insert-real-data-template.sql**
- Template for your actual data
- Proper format examples
- Base token guidelines
- Validation queries included

## 🔧 Troubleshooting

### **Common Issues:**

#### **Foreign Key Constraint Errors**
- Always delete in order: auction_history → players → teams
- Use the provided scripts to avoid constraint issues

#### **Duplicate ID Errors**
- Ensure player_id and team_id values are unique
- Use consistent naming convention (e.g., CPL_P001, CPL_T001)

#### **Invalid Role Values**
- Use exact values: 'Batsman', 'Bowler', 'All-rounder', 'WicketKeeper'
- Check for typos and extra spaces

#### **Base Token Validation**
- Ensure base_tokens are positive integers
- Follow recommended ranges for each role
- Use Player Valuation Calculator for accuracy

### **Data Validation Queries:**

```sql
-- Check for duplicate player IDs
SELECT player_id, COUNT(*) FROM players GROUP BY player_id HAVING COUNT(*) > 1;

-- Check for invalid roles
SELECT DISTINCT role FROM players WHERE role NOT IN ('Batsman', 'Bowler', 'All-rounder', 'WicketKeeper');

-- Check base token distribution
SELECT role, MIN(base_tokens), MAX(base_tokens), AVG(base_tokens), COUNT(*) FROM players GROUP BY role;
```

## 🎪 Ready for Live Auction

Once your data is loaded:

1. **✅ Teams configured** with proper budgets
2. **✅ Players loaded** with fair base prices  
3. **✅ Media files uploaded** (logos and photos)
4. **✅ Test auction completed** successfully
5. **✅ Public view tested** and working
6. **✅ Admin controls verified** and secure

Your CPL auction system is now ready for the live event! 🏆

## 📞 Support

If you encounter issues:
1. Check the validation queries in the SQL scripts
2. Review the error messages carefully
3. Ensure all foreign key relationships are maintained
4. Use the Data Cleanup component in Admin Panel for easy management

The system is designed to be robust and user-friendly for managing real auction data!