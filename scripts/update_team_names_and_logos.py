#!/usr/bin/env python3
"""
Update team names and logo filenames in captain_team_assignments.xlsx
"""

import pandas as pd
from pathlib import Path

def update_teams():
    """Update team names and logos"""
    
    print("🏆 Updating Team Names and Logos...")
    print("=" * 70)
    
    # Team mapping with actual names and logo files
    team_updates = {
        'Team 1': {'name': 'Avengers', 'logo': 'Avengers-removebg-preview.png'},
        'Team 2': {'name': 'Fearless Falcons', 'logo': 'Feralessfalcons.png'},
        'Team 3': {'name': 'Hits & Misses', 'logo': 'HitsMisses.png'},
        'Team 4': {'name': 'Mavericks', 'logo': 'Mavericks.png'},
        'Team 5': {'name': 'Quality Strikers', 'logo': 'Quality Strikers.png'},
        'Team 6': {'name': 'Pirates', 'logo': 'Pirates.png'},
        'Team 7': {'name': 'CSK', 'logo': 'csk.png'},
        'Team 8': {'name': 'Digititans', 'logo': 'digititans.png'}
    }
    
    # Read captain assignments
    captain_file = Path('data/captain_team_assignments.xlsx')
    teams_df = pd.read_excel(captain_file, sheet_name='Teams')
    
    print("📋 Current teams:")
    for _, row in teams_df.iterrows():
        print(f"  {row['TeamName']} → {row['LogoFile']}")
    print()
    
    # Update team names and logos
    print("🔄 Updating to:")
    for idx, row in teams_df.iterrows():
        old_name = row['TeamName']
        if old_name in team_updates:
            new_name = team_updates[old_name]['name']
            new_logo = team_updates[old_name]['logo']
            teams_df.at[idx, 'TeamName'] = new_name
            teams_df.at[idx, 'LogoFile'] = new_logo
            print(f"  ✅ {old_name} → {new_name} (Logo: {new_logo})")
    
    print()
    
    # Save updated file
    print("💾 Saving updated captain_team_assignments.xlsx...")
    with pd.ExcelWriter(captain_file, engine='openpyxl', mode='a', if_sheet_exists='overlay') as writer:
        teams_df.to_excel(writer, sheet_name='Teams', index=False)
    
    print(f"✅ Updated: {captain_file}")
    print()
    
    # Also update CPL_Players_Editable.xlsx Teams sheet
    players_file = Path('data/CPL_Players_Editable.xlsx')
    
    print("💾 Updating CPL_Players_Editable.xlsx Teams sheet...")
    
    # Prepare teams data
    teams_export = []
    for _, row in teams_df.iterrows():
        teams_export.append({
            'TeamID': row['TeamID'],
            'TeamName': row['TeamName'],
            'LogoFile': row['LogoFile']
        })
    
    teams_export_df = pd.DataFrame(teams_export)
    
    # Read players
    players_df = pd.read_excel(players_file, sheet_name='Players')
    
    # Write both sheets
    with pd.ExcelWriter(players_file, engine='openpyxl') as writer:
        players_df.to_excel(writer, sheet_name='Players', index=False)
        teams_export_df.to_excel(writer, sheet_name='Teams', index=False)
    
    print(f"✅ Updated: {players_file}")
    print()
    
    # Generate SQL to update Supabase
    print("📝 Generating SQL for Supabase...")
    
    sql_file = Path('sql/update_team_names.sql')
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write("-- Update Team Names and Logos\n")
        f.write("-- Run this in Supabase SQL Editor\n\n")
        
        for _, row in teams_df.iterrows():
            team_id = row['TeamID']
            team_name = row['TeamName']
            logo_file = row['LogoFile']
            
            f.write(f"UPDATE teams SET team_name = '{team_name}', logo_file = '{logo_file}' WHERE team_id = '{team_id}';\n")
        
        f.write("\n-- Verify updates\n")
        f.write("SELECT team_id, team_name, logo_file FROM teams ORDER BY team_id;\n")
    
    print(f"✅ Created: {sql_file}")
    print()
    
    print("📊 SUMMARY")
    print("=" * 70)
    print("✅ Updated 8 team names and logos")
    print()
    print("🎯 NEXT STEPS:")
    print("  1. Run sql/update_team_names.sql in Supabase")
    print("  2. Upload CPL_Players_Editable.xlsx to update the app")
    print("  3. Team logos will display correctly")
    print()
    print("✅ Update completed!")

if __name__ == "__main__":
    update_teams()
