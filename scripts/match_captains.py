#!/usr/bin/env python3
"""
Helper script to match captain names with player names
"""

import pandas as pd
from pathlib import Path
from difflib import get_close_matches

def match_captains():
    """Find closest matches for captain names"""
    
    print("🔍 Captain Name Matching Helper")
    print("=" * 70)
    
    # Read files
    captain_file = Path('data/captain_team_assignments.xlsx')
    players_file = Path('data/CPL_Players_Editable.xlsx')
    
    captains_df = pd.read_excel(captain_file)
    players_df = pd.read_excel(players_file, sheet_name='Players')
    
    player_names = players_df['Name'].tolist()
    
    print("\n👑 CAPTAIN MATCHES:")
    print("-" * 70)
    for _, row in captains_df.iterrows():
        captain_name = row.get('Captain', '')
        if pd.isna(captain_name) or str(captain_name).strip() == '':
            continue
            
        matches = get_close_matches(str(captain_name), player_names, n=3, cutoff=0.6)
        print(f"\nCaptain: {captain_name}")
        if matches:
            print(f"  Possible matches:")
            for i, match in enumerate(matches, 1):
                player_id = players_df[players_df['Name'] == match].iloc[0]['PlayerID']
                print(f"    {i}. {match} (ID: {player_id})")
        else:
            print(f"  ❌ No close matches found")
    
    print("\n\n🥈 VICE-CAPTAIN MATCHES:")
    print("-" * 70)
    for _, row in captains_df.iterrows():
        vice_captain_name = row.get('ViceCaptain', '')
        if pd.isna(vice_captain_name) or str(vice_captain_name).strip() == '':
            continue
            
        matches = get_close_matches(str(vice_captain_name), player_names, n=3, cutoff=0.6)
        print(f"\nVice-Captain: {vice_captain_name}")
        if matches:
            print(f"  Possible matches:")
            for i, match in enumerate(matches, 1):
                player_id = players_df[players_df['Name'] == match].iloc[0]['PlayerID']
                print(f"    {i}. {match} (ID: {player_id})")
        else:
            print(f"  ❌ No close matches found")
    
    print("\n" + "=" * 70)
    print("💡 TIP: Update the captain_team_assignments.xlsx file with exact")
    print("   names from the players list, then run process_captains.py again")

if __name__ == "__main__":
    match_captains()
