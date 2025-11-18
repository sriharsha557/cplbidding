#!/usr/bin/env python3
"""
Update team logo filenames in the Excel file
"""

import pandas as pd
from pathlib import Path

def update_team_logos():
    """Update team logos to match actual files in public folder"""
    
    print("🎨 Updating Team Logo Filenames...")
    print("=" * 70)
    
    # Team logo mapping (based on files in public folder)
    team_logos = {
        'Team 1': 'spartans.jpg',
        'Team 2': 'warriors.jpg',
        'Team 3': 'eagles.jpg',
        'Team 4': 'knights.jpg',
        'Team 5': 'dragons.jpg',
        'Team 6': 'panthers.jpg',
        'Team 7': 'pirates.jpg',
        'Team 8': 'cheetah.jpg'  # or hummingbird.jpg
    }
    
    # Read the Excel file
    players_file = Path('data/CPL_Players_Editable.xlsx')
    
    # Read both sheets
    players_df = pd.read_excel(players_file, sheet_name='Players')
    teams_df = pd.read_excel(players_file, sheet_name='Teams')
    
    print(f"📊 Found {len(teams_df)} teams")
    print()
    
    # Update logo filenames
    print("🔄 Updating logo filenames:")
    for idx, row in teams_df.iterrows():
        team_name = row['TeamName']
        old_logo = row['LogoFile']
        new_logo = team_logos.get(team_name, old_logo)
        teams_df.at[idx, 'LogoFile'] = new_logo
        print(f"  {team_name}: {old_logo} → {new_logo}")
    
    print()
    
    # Save updated file
    print("💾 Saving updated Excel file...")
    with pd.ExcelWriter(players_file, engine='openpyxl') as writer:
        players_df.to_excel(writer, sheet_name='Players', index=False)
        teams_df.to_excel(writer, sheet_name='Teams', index=False)
    
    print(f"✅ Updated: {players_file}")
    print()
    
    print("📊 TEAM LOGOS")
    print("=" * 70)
    for _, row in teams_df.iterrows():
        print(f"  {row['TeamName']} ({row['TeamID']}) → {row['LogoFile']}")
    
    print()
    print("✅ Team logos updated successfully!")
    print()
    print("🎯 NEXT STEPS:")
    print("  1. Upload CPL_Players_Editable.xlsx to the app")
    print("  2. Team logos will display automatically")

if __name__ == "__main__":
    update_team_logos()
