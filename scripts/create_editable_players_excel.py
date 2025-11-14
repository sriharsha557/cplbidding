#!/usr/bin/env python3
"""
Create Editable Players Excel Template
Allows manual control over player roles and base tokens before SQL generation
"""

import pandas as pd
from pathlib import Path

def create_editable_players_excel():
    """Create editable Excel template for players"""
    
    print("📝 Creating Editable Players Excel Template...")
    print("=" * 70)
    
    # Read the complete data with all details
    complete_df = pd.read_excel('assets/CPL_Auction_Data_2025.xlsx', sheet_name='Complete_Data')
    
    # Filter only auction players (not captains)
    players_df = complete_df[complete_df.get('IsCaptain', False) != True].copy()
    
    print(f"📊 Loaded {len(players_df)} players for editing")
    
    # Create editable structure matching Supabase table
    editable_df = pd.DataFrame({
        # Identification
        'PlayerID': players_df['PlayerID'],
        'Name': players_df['Name'],
        'EmployeeID': players_df['EmployeeID'],
        'ContactNumber': players_df['ContactNumber'],
        
        # Original roles (for reference)
        'PreferredRole_Original': players_df['PreferredRole'],
        'SecondaryRole_Original': players_df['SecondaryRole'],
        
        # EDITABLE FIELDS (these will be used for SQL generation)
        'Role': players_df['Role'],  # ⚠️ MUST be: Batsman, Bowler, All-rounder, WicketKeeper
        'Department': players_df['Department'],  # Auto-update based on Role
        'BaseTokens': players_df['BaseTokens'],  # ⚠️ EDIT THIS based on player skill
        
        # Additional fields
        'PhotoFileName': players_df['PhotoFileName'],
        'Status': 'Available',  # Default for auction players
        
        # For your notes
        'Notes': ''
    })
    
    # Sort by role for easier editing
    role_order = {'Batsman': 1, 'Bowler': 2, 'All-rounder': 3, 'WicketKeeper': 4}
    editable_df['_sort'] = editable_df['Role'].map(role_order)
    editable_df = editable_df.sort_values('_sort').drop('_sort', axis=1)
    editable_df = editable_df.reset_index(drop=True)
    
    # Create instructions sheet
    instructions = pd.DataFrame({
        'Step': [1, 2, 3, 4, 5, 6],
        'Action': [
            '📖 READ THIS FIRST',
            '✏️ Edit Role column',
            '💰 Adjust BaseTokens',
            '📁 Update Department',
            '💾 Save this file',
            '🚀 Generate SQL'
        ],
        'Details': [
            'Review all player data. Original roles are shown for reference.',
            'Change Role if needed. MUST use exact values: Batsman, Bowler, All-rounder, WicketKeeper',
            'Set BaseTokens based on player skill. See Token_Guidelines sheet for recommendations.',
            'Department must match Role: Batting, Bowling, All-rounder, or Wicket Keeping',
            'Save as: CPL_Players_Editable.xlsx (keep this filename)',
            'Run: python generate_sql_from_players_excel.py'
        ]
    })
    
    # Create validation reference
    validation = pd.DataFrame({
        'Field': ['Role', 'Role', 'Role', 'Role', '', 'Department', 'Department', 'Department', 'Department'],
        'AllowedValue': [
            'Batsman', 'Bowler', 'All-rounder', 'WicketKeeper', '',
            'Batting', 'Bowling', 'All-rounder', 'Wicket Keeping'
        ],
        'UsedFor': [
            'Batsmen', 'Bowlers', 'All-rounders (note hyphen)', 'Wicketkeepers (CamelCase)', '',
            'Batsman role', 'Bowler role', 'All-rounder role', 'WicketKeeper role'
        ],
        'Important': [
            '⚠️ Exact spelling required', '⚠️ Exact spelling required', 
            '⚠️ Must have hyphen', '⚠️ CamelCase, no space', '',
            'Auto-set based on Role', 'Auto-set based on Role',
            'Auto-set based on Role', 'Auto-set based on Role'
        ]
    })
    
    # Create token guidelines
    token_guidelines = pd.DataFrame({
        'Role': ['Batsman', 'Batsman', 'Batsman', 'Batsman', '',
                 'Bowler', 'Bowler', 'Bowler', 'Bowler', '',
                 'All-rounder', 'All-rounder', 'All-rounder', 'All-rounder', '',
                 'WicketKeeper', 'WicketKeeper', 'WicketKeeper', 'WicketKeeper'],
        'Tier': ['⭐⭐⭐⭐⭐ Excellent', '⭐⭐⭐⭐ Good', '⭐⭐⭐ Average', '⭐⭐ Below Average', '',
                 '⭐⭐⭐⭐⭐ Excellent', '⭐⭐⭐⭐ Good', '⭐⭐⭐ Average', '⭐⭐ Below Average', '',
                 '⭐⭐⭐⭐⭐ Excellent', '⭐⭐⭐⭐ Good', '⭐⭐⭐ Average', '⭐⭐ Below Average', '',
                 '⭐⭐⭐⭐⭐ Excellent', '⭐⭐⭐⭐ Good', '⭐⭐⭐ Average', '⭐⭐ Below Average'],
        'TokenRange': ['50-70', '30-49', '15-29', '8-14', '',
                       '45-65', '25-44', '12-24', '6-11', '',
                       '60-80', '35-59', '20-34', '10-19', '',
                       '40-60', '22-39', '12-21', '5-11'],
        'Description': [
            'Star batsmen, match winners, consistent high scores',
            'Reliable performers, good averages',
            'Squad players, decent contributors',
            'Backup options, limited experience', '',
            'Premium bowlers, wicket-takers, economy < 7.5',
            'Quality bowlers, consistent performers',
            'Developing bowlers, potential',
            'Support bowlers, squad depth', '',
            'Premium all-rounders, game changers, dual threat',
            'Balanced contributors, solid in both',
            'Utility players, one skill strong',
            'Squad fillers, developing', '',
            'Premium keepers, captain material, excellent batting',
            'Specialist keepers, reliable glovework',
            'Backup keepers, decent keeping',
            'Emergency options, limited experience'
        ]
    })
    
    # Create role distribution summary
    role_summary = pd.DataFrame({
        'Role': ['Batsman', 'Bowler', 'All-rounder', 'WicketKeeper', 'TOTAL'],
        'Count': [
            len(editable_df[editable_df['Role'] == 'Batsman']),
            len(editable_df[editable_df['Role'] == 'Bowler']),
            len(editable_df[editable_df['Role'] == 'All-rounder']),
            len(editable_df[editable_df['Role'] == 'WicketKeeper']),
            len(editable_df)
        ],
        'CurrentAvgTokens': [
            editable_df[editable_df['Role'] == 'Batsman']['BaseTokens'].mean(),
            editable_df[editable_df['Role'] == 'Bowler']['BaseTokens'].mean(),
            editable_df[editable_df['Role'] == 'All-rounder']['BaseTokens'].mean(),
            editable_df[editable_df['Role'] == 'WicketKeeper']['BaseTokens'].mean(),
            editable_df['BaseTokens'].mean()
        ],
        'RecommendedRange': ['15-70', '12-65', '20-80', '12-60', '12-80'],
        'Notes': [
            '34 players - Core batting lineup',
            '4 players - Will be highly competitive!',
            '42 players - Longest auction phase',
            '14 players - Wicket keeping specialists',
            '94 total players for auction'
        ]
    })
    
    # Save to Excel
    output_file = Path('CPL_Players_Editable.xlsx')
    
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # Main editable sheet
        editable_df.to_excel(writer, sheet_name='Players', index=False)
        
        # Reference sheets
        instructions.to_excel(writer, sheet_name='Instructions', index=False)
        validation.to_excel(writer, sheet_name='Validation', index=False)
        token_guidelines.to_excel(writer, sheet_name='Token_Guidelines', index=False)
        role_summary.to_excel(writer, sheet_name='Summary', index=False)
    
    print(f"✅ Created: {output_file}")
    print()
    print("📋 Sheets created:")
    print("   1. Players - Main editable data (94 players)")
    print("   2. Instructions - Step-by-step guide")
    print("   3. Validation - Allowed values for fields")
    print("   4. Token_Guidelines - Base token recommendations")
    print("   5. Summary - Current role distribution")
    print()
    print("📊 Current Distribution:")
    print(f"   Batsmen: {len(editable_df[editable_df['Role'] == 'Batsman'])}")
    print(f"   Bowlers: {len(editable_df[editable_df['Role'] == 'Bowler'])}")
    print(f"   All-rounders: {len(editable_df[editable_df['Role'] == 'All-rounder'])}")
    print(f"   Wicketkeepers: {len(editable_df[editable_df['Role'] == 'WicketKeeper'])}")
    print()
    print("🎯 NEXT STEPS:")
    print("   1. Open CPL_Players_Editable.xlsx")
    print("   2. Edit Role and BaseTokens as needed")
    print("   3. Save the file")
    print("   4. Run: python generate_sql_from_players_excel.py")
    print()
    
    return True

if __name__ == "__main__":
    try:
        success = create_editable_players_excel()
        if success:
            print("✅ Editable players Excel created successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()