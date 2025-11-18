#!/usr/bin/env python3
"""
Add Teams sheet to CPL_Players_Editable.xlsx
"""

import pandas as pd
from pathlib import Path

def add_teams_sheet():
    """Add Teams sheet with team information"""
    
    print("📋 Adding Teams Sheet to CPL_Players_Editable.xlsx...")
    print("=" * 70)
    
    # Read captain assignments to get team info
    captain_file = Path('data/captain_team_assignments.xlsx')
    teams_df = pd.read_excel(captain_file, sheet_name='Teams')
    
    print(f"📊 Found {len(teams_df)} teams")
    print()
    
    # Prepare teams data for the Players Excel file
    teams_data = []
    for _, row in teams_df.iterrows():
        team = {
            'TeamID': row['TeamID'],
            'TeamName': row['TeamName'],
            'LogoFile': row['LogoFile']
        }
        teams_data.append(team)
        print(f"  ✅ {team['TeamName']} ({team['TeamID']}) - Logo: {team['LogoFile']}")
    
    teams_export_df = pd.DataFrame(teams_data)
    
    print()
    
    # Read existing players file
    players_file = Path('data/CPL_Players_Editable.xlsx')
    
    # Read all existing sheets
    with pd.ExcelFile(players_file) as xls:
        existing_sheets = xls.sheet_names
        print(f"📄 Existing sheets: {existing_sheets}")
    
    # Read players data
    players_df = pd.read_excel(players_file, sheet_name='Players')
    
    print()
    print("💾 Saving updated Excel file with Teams sheet...")
    
    # Write both sheets
    with pd.ExcelWriter(players_file, engine='openpyxl') as writer:
        players_df.to_excel(writer, sheet_name='Players', index=False)
        teams_export_df.to_excel(writer, sheet_name='Teams', index=False)
    
    print(f"✅ Updated: {players_file}")
    print()
    
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"✅ Added Teams sheet with {len(teams_export_df)} teams")
    print(f"✅ Players sheet: {len(players_df)} players")
    print()
    print("🎯 NEXT STEPS:")
    print("  1. Upload CPL_Players_Editable.xlsx to the app")
    print("  2. Choose 'Merge with Supabase' or 'Upload to Supabase'")
    print("  3. Verify data loaded correctly")
    print()
    print("✅ Teams sheet added successfully!")

if __name__ == "__main__":
    add_teams_sheet()
