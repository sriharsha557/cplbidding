# Editable Excel Workflow Guide

## 🎯 **Overview**

You now have full control over player roles and base tokens through an editable Excel file. This allows you to review and adjust all player data before generating the final SQL for Supabase.

## 📁 **Files Created:**

### **1. CPL_Players_Editable.xlsx** ⭐ Main File
**Purpose**: Edit player roles and base tokens
**Sheets**:
- **Players**: Main editable data (94 players)
- **Instructions**: Step-by-step guide
- **Validation**: Allowed values reference
- **Token_Guidelines**: Base token recommendations
- **Summary**: Current role distribution

### **2. create_editable_players_excel.py**
**Purpose**: Generates the editable Excel from registration data
**Run**: `python create_editable_players_excel.py`

### **3. generate_sql_from_players_excel.py**
**Purpose**: Generates SQL from your edited Excel
**Run**: `python generate_sql_from_players_excel.py`

## 🔄 **Complete Workflow:**

### **Step 1: Generate Editable Excel** ✅ Done!
```bash
python create_editable_players_excel.py
```
**Output**: `CPL_Players_Editable.xlsx`

### **Step 2: Edit Player Data** 📝 Your Turn!

Open `CPL_Players_Editable.xlsx` and edit:

#### **Editable Columns:**

| Column | Editable | Rules | Example |
|--------|----------|-------|---------|
| **PlayerID** | ❌ No | Auto-generated | `7J4N` |
| **Name** | ❌ No | From registration | `Abishai Jason Narla` |
| **EmployeeID** | ❌ No | From registration | `54YB` |
| **Role** | ✅ **YES** | Must be exact: `Batsman`, `Bowler`, `All-rounder`, `WicketKeeper` | `Batsman` |
| **Department** | ✅ **YES** | Must match Role | `Batting` |
| **BaseTokens** | ✅ **YES** | 5-80 range recommended | `45` |
| **PhotoFileName** | ⚠️ Optional | Auto-generated | `abishai_narla.jpg` |
| **Status** | ❌ No | Always `Available` | `Available` |
| **Notes** | ✅ **YES** | Your comments | `Star player` |

#### **Critical Rules:**

**Role Values** (EXACT spelling required):
- ✅ `Batsman` (not batsman or Batsmen)
- ✅ `Bowler` (not bowler or Bowlers)
- ✅ `All-rounder` (with hyphen, not All-Rounder)
- ✅ `WicketKeeper` (CamelCase, not Wicket Keeper)

**Department Values** (must match Role):
- `Batsman` → `Batting`
- `Bowler` → `Bowling`
- `All-rounder` → `All-rounder`
- `WicketKeeper` → `Wicket Keeping`

**BaseTokens Guidelines**:
- **Batsman**: 15-70 tokens
- **Bowler**: 12-65 tokens
- **All-rounder**: 20-80 tokens
- **WicketKeeper**: 12-60 tokens

See **Token_Guidelines** sheet for detailed recommendations.

### **Step 3: Save Your Changes**
- Keep filename as: `CPL_Players_Editable.xlsx`
- Save in the same location

### **Step 4: Generate Final SQL**
```bash
python generate_sql_from_players_excel.py
```

**Output**: `CPL_Players_Final_Insert.sql`

**What it does**:
- ✅ Validates all role values
- ✅ Checks for missing data
- ✅ Calculates auction_order automatically
- ✅ Generates Supabase-ready SQL
- ✅ Includes verification queries

### **Step 5: Review Generated SQL**

Open `CPL_Players_Final_Insert.sql` and review:
- Player count matches expectations
- Role distribution looks correct
- Base tokens are reasonable
- Auction order is sequential

### **Step 6: Insert into Supabase**

1. **Backup first** (important!):
```sql
CREATE TABLE players_backup AS SELECT * FROM players;
```

2. **Clear existing data**:
```sql
DELETE FROM auction_history;
DELETE FROM players;
```

3. **Run the generated SQL**:
- Copy content from `CPL_Players_Final_Insert.sql`
- Paste into Supabase SQL Editor
- Click "Run"

4. **Verify with included queries**:
```sql
SELECT COUNT(*) FROM players;
SELECT role, COUNT(*) FROM players GROUP BY role;
```

## 📊 **Example Editing Scenarios:**

### **Scenario 1: Change Player Role**
**Original**: Player is `All-rounder`
**Change to**: `Batsman` (if they're primarily a batsman)
**Update**: Change `Department` to `Batting`

### **Scenario 2: Adjust Base Tokens**
**Original**: All players have 35 tokens
**Adjust**: 
- Star players → 60-70 tokens
- Good players → 40-50 tokens
- Average players → 25-35 tokens
- New players → 15-20 tokens

### **Scenario 3: Balance Role Distribution**
**Current**: 42 All-rounders, 4 Bowlers
**Adjust**: Convert some All-rounders to Bowlers if they're primarily bowlers

## ⚠️ **Common Mistakes to Avoid:**

### **❌ Wrong Role Spelling**
```
❌ batsman → ✅ Batsman
❌ All-Rounder → ✅ All-rounder
❌ Wicket Keeper → ✅ WicketKeeper
```

### **❌ Department Mismatch**
```
❌ Role: Batsman, Department: Bowling
✅ Role: Batsman, Department: Batting
```

### **❌ Invalid Token Values**
```
❌ BaseTokens: 0 (too low)
❌ BaseTokens: 150 (too high)
✅ BaseTokens: 45 (reasonable)
```

## 🔍 **Validation Checks:**

The SQL generation script automatically checks:
- ✅ All roles are valid
- ✅ No missing required fields
- ✅ BaseTokens are numeric
- ✅ PlayerIDs are unique

If validation fails, you'll see clear error messages.

## 💡 **Tips for Editing:**

### **Use Excel Features:**
1. **Sort by Role**: Group similar players together
2. **Filter by BaseTokens**: Find players to adjust
3. **Use Notes column**: Document your changes
4. **Color code**: Highlight edited rows

### **Token Distribution Strategy:**
- **Top 10%**: 60-80 tokens (stars)
- **Next 30%**: 40-59 tokens (good)
- **Next 40%**: 25-39 tokens (average)
- **Bottom 20%**: 15-24 tokens (developing)

### **Role Balance:**
Aim for:
- **Batsmen**: 30-40 players
- **Bowlers**: 10-15 players (increase from 4!)
- **All-rounders**: 30-40 players
- **Wicketkeepers**: 10-15 players

## 🎯 **Benefits of This Workflow:**

✅ **Full Control**: Edit any player's role or tokens
✅ **Validation**: Automatic checks prevent errors
✅ **Flexibility**: Make changes anytime, regenerate SQL
✅ **Audit Trail**: Notes column for documentation
✅ **Repeatable**: Can regenerate SQL multiple times
✅ **Safe**: Test locally before Supabase insertion

## 📋 **Quick Reference:**

```bash
# 1. Create editable Excel (already done)
python create_editable_players_excel.py

# 2. Edit CPL_Players_Editable.xlsx in Excel
# (Your manual step)

# 3. Generate SQL from edited Excel
python generate_sql_from_players_excel.py

# 4. Review CPL_Players_Final_Insert.sql

# 5. Run SQL in Supabase
```

## 🚀 **You're in Control!**

You now have complete control over:
- ✅ Player roles (change any player's category)
- ✅ Base tokens (set fair prices)
- ✅ Role distribution (balance the auction)
- ✅ Final SQL generation (when you're ready)

Edit the Excel file as many times as needed. Generate fresh SQL whenever you make changes. Perfect for fine-tuning before the live auction! 🏆