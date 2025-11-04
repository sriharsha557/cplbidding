# CPL Category-Based Bidding System

## Overview
The CPL auction now implements **category-based bidding** where players are auctioned by their roles (Batsmen, Bowlers, All-rounders, Wicketkeepers) with dedicated budgets for each category.

## Category Configuration

### 1. Batsmen 🏏
- **Budget Range**: 300-400 tokens
- **Players Required**: 4-5 players
- **Description**: Core batting lineup

### 2. Bowlers 🎯
- **Budget Range**: 300-400 tokens  
- **Players Required**: 4-5 players
- **Description**: Bowling attack

### 3. All-rounders ⚡
- **Budget Range**: 150-200 tokens
- **Players Required**: 3-4 players
- **Description**: Versatile players

### 4. Wicketkeepers 🧤
- **Budget Range**: 100-150 tokens
- **Players Required**: 2-3 players
- **Description**: Wicket keeping specialists

## Auction Flow

### Phase-Based Bidding
1. **Phase 1**: Batsmen auction (all batsmen first)
2. **Phase 2**: Bowlers auction (all bowlers)
3. **Phase 3**: All-rounders auction
4. **Phase 4**: Wicketkeepers auction

### Automatic Player Sorting
- Players are automatically sorted by category
- Within each category, players are sorted by base tokens (highest first)

## Features Implemented

### React Web App
- ✅ **CategoryProgress Component**: Shows current auction phase and category statistics
- ✅ **Enhanced LiveAuction**: Displays category budget validation
- ✅ **Team Budget Tracking**: Real-time category budget monitoring
- ✅ **Phase Indicators**: Visual progress through each category
- ✅ **Budget Validation**: Prevents invalid bids exceeding category limits

### Python Streamlit App
- ✅ **Category Budget Initialization**: Teams start with predefined category budgets
- ✅ **Phase Display**: Shows current auction phase prominently
- ✅ **Budget Validation**: Checks both total and category budgets
- ✅ **Role Space Validation**: Ensures teams don't exceed max players per role
- ✅ **Category Overview**: Sidebar shows progress through each category
- ✅ **Enhanced Team Dashboard**: Displays category budget remaining

### Database Schema
- ✅ **Category Budget Columns**: Separate budget tracking for each category
- ✅ **Role Constraints**: Database enforces valid player roles
- ✅ **Budget History**: Tracks spending by category

## Usage Instructions

### For React App
1. Load auction data (players automatically sorted by category)
2. Start auction - begins with Batsmen phase
3. Bid on players with automatic category budget validation
4. Progress through phases: Batsmen → Bowlers → All-rounders → Wicketkeepers

### For Python App
1. Configure auction settings in sidebar
2. Load CPL data (players auto-sorted by category)
3. Start auction - see current phase prominently displayed
4. Place bids with real-time category budget validation
5. Monitor category progress in sidebar

## Validation Rules

### Team Composition Limits
- **Total Squad**: Maximum 15 players
- **Total Budget**: 1000 tokens
- **Category Budgets**: As defined above
- **Role Limits**: Cannot exceed maximum players per category

### Bidding Validation
1. ✅ Team has sufficient total tokens
2. ✅ Team has sufficient category budget
3. ✅ Team has space in squad
4. ✅ Team has space for this role category
5. ✅ Bid meets minimum base price

## Benefits

### Strategic Bidding
- Teams must plan spending across categories
- Prevents overspending in one category
- Ensures balanced squad composition
- Creates more competitive bidding

### Fair Distribution
- All teams get opportunity in each category
- Prevents monopolization of specific roles
- Encourages strategic planning
- Maintains auction excitement throughout

### Better Squad Balance
- Enforces minimum players per role
- Prevents unbalanced teams
- Ensures competitive matches
- Follows cricket team composition standards

## Technical Implementation

### Key Files Modified
- `src/utils/auctionUtils.js` - Category configuration and utilities
- `src/components/CategoryProgress.js` - New category progress component
- `src/components/LiveAuction.js` - Enhanced with category validation
- `cplbidding.py` - Category budgets and validation
- `supabase-schema.sql` - Database schema with category budgets

### Configuration
All category settings are centralized in `CPL_CATEGORY_BUDGETS` constant, making it easy to adjust budgets and player limits as needed.

## Future Enhancements
- 📊 Category-wise analytics and statistics
- 🎯 Smart bidding suggestions based on category needs
- 📈 Historical category performance tracking
- 🔄 Mid-auction category budget adjustments
- 📱 Mobile-optimized category displays