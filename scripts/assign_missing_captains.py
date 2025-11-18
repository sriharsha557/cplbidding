#!/usr/bin/env python3
"""
Assign the two missing captains to their teams
"""

import pandas as pd
from pathlib import Path

def assign_missing_captains():
    """Assign Mahethar and Anil as captains"""
    
    print("👑 Assigning Missing Captains...")
    print("=" * 70)
    
    players_file = Path('data/CPL_Players_Editable.xlsx')
    players_df = pd.read_excel(players_file, sheet_name='Players')
    
    # Assign Mahethar Reddy Bhavanam (14HB) to Team 1 as Captain
    mahethar_idx = players_df[players_df['PlayerID'] == '14HB'].index
    if not mahethar_idx.empty:
        idx = mahethar_idx[0]
        base_tokens = players_df.at[idx, 'BaseTokens']
        players_df.at[idx, 'IsCaptain'] = True
        players_df.at[idx, 'Status'] = 'Sold'
        players_df.at[idx, 'SoldTo'] = 'Team 1'
        players_df.at[idx, 'SoldPrice'] = base_tokens
        print(f"  ✅ Assigned Mahethar Reddy Bhavanam (14HB) as Captain of Team 1")
    else:
        print(f"  ❌ Player 14HB not found")
    
    # Assign Anil Mardani (MXL5) to Team 2 as Captain
    anil_idx = players_df[players_df['PlayerID'] == 'MXL5'].index
    if not anil_idx.empty:
        idx = anil_idx[0]
        base_tokens = players_df.at[idx, 'BaseTokens']
        players_df.at[idx, 'IsCaptain'] = True
        players_df.at[idx, 'Status'] = 'Sold'
        players_df.at[idx, 'SoldTo'] = 'Team 2'
        players_df.at[idx, 'SoldPrice'] = base_tokens
        print(f"  ✅ Assigned Anil Mardani (MXL5) as Captain of Team 2")
    else:
        print(f"  ❌ Player MXL5 not found")
    
    print()
    
    # Save updated file
    print("💾 Saving updated players file...")
    with pd.ExcelWriter(players_file, engine='openpyxl', mode='a', if_sheet_exists='overlay') as writer:
        players_df.to_excel(writer, sheet_name='Players', index=False)
    
    print(f"✅ Updated: {players_file}")
    print()
    
    # Summary
    captains_count = players_df['IsCaptain'].sum()
    vice_captains_count = players_df['IsViceCaptain'].sum()
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
    print()
    print("✅ Assignment completed!")

if __name__ == "__main__":
    assign_missing_captains()
