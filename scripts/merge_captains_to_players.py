#!/usr/bin/env python3
"""
Merge captains from captain_team_assignments into CPL_Players_Editable
"""

import pandas as pd
from pathlib import Path

def merge_captains():
    """Merge captain data into players file"""
    
    print("🔄 Merging Captains into Players File...")
    print("=" * 70)
    
    # Read files
    captain_file = Path('data/captain_team_assignments.xlsx')
    players_file = Path('data/CPL_Players_Editable.xlsx')
    
    # Read available captains
    available_captains_df = pd.read_excel(captain_file, sheet_name='Available_Captains')
    
    # Read team assignments
    teams_df = pd.read_excel(captain_file, sheet_name='Teams')
    
    # Read current players
    players_df = pd.read_excel(players_file, sheet_name='Players')
    
    print(f"📊 Current players in file: {len(players_df)}")
    print(f"📊 Available captains to add: {len(available_captains_df)}")
    print()
    
    # Create team assignment mapping
    captain_to_team = {}
    vice_captain_to_team = {}
    
    for _, row in teams_df.iterrows():
        team_name = row['TeamName']
        captain_to_team[str(row['Captain']).strip()] = team_name
        vice_captain_to_team[str(row['ViceCaptain']).strip()] = team_name
    
    # Add captains to players list
    new_players = []
    for _, row in available_captains_df.iterrows():
        player_id = str(row['EmployeeID']).upper()
        name = str(row['Name']).strip()
        
        # Skip if already in players list
        if player_id in players_df['PlayerID'].values:
            print(f"  ⏭️  Skipping {name} ({player_id}) - already in players list")
            continue
        
        # Determine if captain or vice-captain and which team
        is_captain = name in captain_to_team
        is_vice_captain = name in vice_captain_to_team
        team = captain_to_team.get(name) or vice_captain_to_team.get(name)
        
        new_player = {
            'PlayerID': player_id,
            'Name': name,
            'Role': row['Role'],
            'BaseTokens': row['BaseTokens'],
            'PhotoFileName': f"{player_id}.jpg",
            'Department': None,
            'Status': 'Sold' if team else 'Available',
            'SoldTo': team if team else None,
            'SoldPrice': row['BaseTokens'] if team else 0,
            'IsCaptain': is_captain,
            'IsViceCaptain': is_vice_captain
        }
        
        new_players.append(new_player)
        
        role_emoji = '👑' if is_captain else '🥈' if is_vice_captain else ''
        status = f"→ {team}" if team else "Available"
        print(f"  ✅ Adding {role_emoji} {name} ({player_id}) {status}")
    
    print()
    
    if new_players:
        # Append new players
        new_players_df = pd.DataFrame(new_players)
        players_df = pd.concat([players_df, new_players_df], ignore_index=True)
        
        print(f"✅ Added {len(new_players)} new captain/vice-captain players")
    else:
        print("ℹ️  No new players to add")
    
    print(f"📊 Total players now: {len(players_df)}")
    print()
    
    # Save updated file
    print("💾 Saving updated players file...")
    with pd.ExcelWriter(players_file, engine='openpyxl', mode='a', if_sheet_exists='overlay') as writer:
        players_df.to_excel(writer, sheet_name='Players', index=False)
    
    print(f"✅ Updated: {players_file}")
    print()
    
    # Summary
    captains_count = players_df['IsCaptain'].sum() if 'IsCaptain' in players_df.columns else 0
    vice_captains_count = players_df['IsViceCaptain'].sum() if 'IsViceCaptain' in players_df.columns else 0
    pre_sold = len(players_df[players_df['Status'] == 'Sold'])
    available = len(players_df[players_df['Status'] != 'Sold'])
    
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"✅ Total players: {len(players_df)}")
    print(f"✅ Captains: {captains_count}")
    print(f"✅ Vice-Captains: {vice_captains_count}")
    print(f"✅ Pre-sold to teams: {pre_sold}")
    print(f"✅ Available for auction: {available}")
    print()
    print("🎯 NEXT STEPS:")
    print("  1. Run process_captains.py to generate SQL")
    print("  2. Upload Excel to Supabase")
    print("  3. Captains/Vice-captains will be pre-assigned to teams")
    print()
    print("✅ Merge completed!")

if __name__ == "__main__":
    merge_captains()
