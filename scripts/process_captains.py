#!/usr/bin/env python3
"""
Process Captain Team Assignments
Reads captain assignments and updates the system
"""

import pandas as pd
from pathlib import Path

def process_captains():
    """Process captain team assignments"""
    
    print("👑 Processing Captain Team Assignments...")
    print("=" * 70)
    
    # Read captain assignments
    captain_file = Path('data/captain_team_assignments.xlsx')
    
    if not captain_file.exists():
        print(f"❌ Error: {captain_file} not found!")
        return False
    
    try:
        # Read captain data from Teams sheet
        captains_df = pd.read_excel(captain_file, sheet_name='Teams')
        
        # Read available captains with IDs
        available_captains_df = pd.read_excel(captain_file, sheet_name='Available_Captains')
        
        print(f"📊 Loaded {len(captains_df)} team assignments")
        print(f"📊 Loaded {len(available_captains_df)} available captains/vice-captains")
        print()
        
        # Create name to ID mapping (uppercase IDs for consistency)
        name_to_id = {}
        for _, row in available_captains_df.iterrows():
            name_to_id[str(row['Name']).strip()] = str(row['EmployeeID']).upper()
        
        print(f"📋 Name to ID mapping created for {len(name_to_id)} players")
        print()
        
        # Display captain assignments with resolved IDs
        print("👑 CAPTAIN ASSIGNMENTS")
        print("=" * 70)
        for _, row in captains_df.iterrows():
            team = row.get('TeamName', 'Unknown')
            captain = row.get('Captain', 'Unknown')
            vice_captain = row.get('ViceCaptain', 'Unknown')
            
            captain_id = name_to_id.get(str(captain).strip(), 'N/A')
            vice_captain_id = name_to_id.get(str(vice_captain).strip(), 'N/A')
            
            print(f"  {team}:")
            print(f"    Captain: {captain} (ID: {captain_id})")
            print(f"    Vice-Captain: {vice_captain} (ID: {vice_captain_id})")
        print()
        
        # Read players data
        players_file = Path('data/CPL_Players_Editable.xlsx')
        players_df = pd.read_excel(players_file, sheet_name='Players')
        
        # Add captain columns if they don't exist
        if 'IsCaptain' not in players_df.columns:
            players_df['IsCaptain'] = False
        if 'IsViceCaptain' not in players_df.columns:
            players_df['IsViceCaptain'] = False
        
        # Process Captains using ID mapping
        print("👑 MATCHING CAPTAINS BY ID:")
        print("-" * 70)
        
        captain_ids = []
        for captain_name in captains_df['Captain'].tolist():
            if pd.isna(captain_name) or str(captain_name).strip() == '':
                continue
            
            player_id = name_to_id.get(str(captain_name).strip())
            if player_id and player_id in players_df['PlayerID'].values:
                captain_ids.append(player_id)
                print(f"  ✅ Captain: {captain_name} → {player_id}")
            else:
                print(f"  ⚠️  Captain not found: {captain_name}")
        
        players_df['IsCaptain'] = players_df['PlayerID'].isin(captain_ids)
        print()
        
        # Process Vice-Captains using ID mapping
        print("🥈 MATCHING VICE-CAPTAINS BY ID:")
        print("-" * 70)
        
        vice_captain_ids = []
        for vice_captain_name in captains_df['ViceCaptain'].tolist():
            if pd.isna(vice_captain_name) or str(vice_captain_name).strip() == '':
                continue
            
            player_id = name_to_id.get(str(vice_captain_name).strip())
            if player_id and player_id in players_df['PlayerID'].values:
                vice_captain_ids.append(player_id)
                print(f"  ✅ Vice-Captain: {vice_captain_name} → {player_id}")
            else:
                print(f"  ⚠️  Vice-Captain not found: {vice_captain_name}")
        
        players_df['IsViceCaptain'] = players_df['PlayerID'].isin(vice_captain_ids)
        print()
        
        # Mark captains and vice-captains as already sold to their teams
        print("🔒 ASSIGNING CAPTAINS TO TEAMS:")
        print("-" * 70)
        
        for _, row in captains_df.iterrows():
            team_name = row.get('TeamName', '')
            captain_name = row.get('Captain', '')
            vice_captain_name = row.get('ViceCaptain', '')
            
            # Assign captain using ID
            if not pd.isna(captain_name) and str(captain_name).strip() != '':
                captain_id = name_to_id.get(str(captain_name).strip())
                if captain_id:
                    captain_match = players_df[players_df['PlayerID'] == captain_id]
                    if not captain_match.empty:
                        idx = captain_match.index[0]
                        players_df.at[idx, 'Status'] = 'Sold'
                        players_df.at[idx, 'SoldTo'] = team_name
                        players_df.at[idx, 'SoldPrice'] = captain_match.iloc[0]['BaseTokens']
                        print(f"  ✅ {team_name}: Captain {captain_name} ({captain_id}) assigned")
            
            # Assign vice-captain using ID
            if not pd.isna(vice_captain_name) and str(vice_captain_name).strip() != '':
                vice_captain_id = name_to_id.get(str(vice_captain_name).strip())
                if vice_captain_id:
                    vice_captain_match = players_df[players_df['PlayerID'] == vice_captain_id]
                    if not vice_captain_match.empty:
                        idx = vice_captain_match.index[0]
                        players_df.at[idx, 'Status'] = 'Sold'
                        players_df.at[idx, 'SoldTo'] = team_name
                        players_df.at[idx, 'SoldPrice'] = vice_captain_match.iloc[0]['BaseTokens']
                        print(f"  ✅ {team_name}: Vice-Captain {vice_captain_name} ({vice_captain_id}) assigned")
        
        print()
        
        captains_marked = players_df['IsCaptain'].sum()
        vice_captains_marked = players_df['IsViceCaptain'].sum()
        pre_assigned = players_df[players_df['Status'] == 'Sold'].shape[0]
        
        print(f"✅ Marked {captains_marked} players as captains")
        print(f"✅ Marked {vice_captains_marked} players as vice-captains")
        print(f"✅ Pre-assigned {pre_assigned} players to teams (excluded from auction)")
        print()
        
        # Save updated players file
        print("💾 Saving updated players file...")
        with pd.ExcelWriter(players_file, engine='openpyxl', mode='a', if_sheet_exists='overlay') as writer:
            players_df.to_excel(writer, sheet_name='Players', index=False)
        
        print(f"✅ Updated: {players_file}")
        print()
        
        # Generate SQL for Supabase
        print("📝 Generating SQL for Supabase...")
        
        sql_file = Path('sql/update_captains.sql')
        with open(sql_file, 'w', encoding='utf-8') as f:
            f.write("-- Update Captain Assignments\n")
            f.write("-- Run this in Supabase SQL Editor\n\n")
            
            # Add columns if not exist
            f.write("-- Add captain columns if not exists\n")
            f.write("ALTER TABLE players ADD COLUMN IF NOT EXISTS is_captain BOOLEAN DEFAULT FALSE;\n")
            f.write("ALTER TABLE players ADD COLUMN IF NOT EXISTS is_vice_captain BOOLEAN DEFAULT FALSE;\n\n")
            
            # Reset all captains and vice-captains
            f.write("-- Reset all players\n")
            f.write("UPDATE players SET is_captain = FALSE, is_vice_captain = FALSE;\n\n")
            
            # Set captains
            f.write("-- Mark captains\n")
            for player_id in captain_ids:
                f.write(f"UPDATE players SET is_captain = TRUE WHERE player_id = '{player_id}';\n")
            
            # Set vice-captains
            f.write("\n-- Mark vice-captains\n")
            for player_id in vice_captain_ids:
                f.write(f"UPDATE players SET is_vice_captain = TRUE WHERE player_id = '{player_id}';\n")
            
            # Assign captains and vice-captains to their teams
            f.write("\n-- Assign captains and vice-captains to teams (pre-sold, excluded from auction)\n")
            for _, row in captains_df.iterrows():
                team_name = row.get('TeamName', '')
                captain_name = row.get('Captain', '')
                vice_captain_name = row.get('ViceCaptain', '')
                
                # Find and assign captain
                if not pd.isna(captain_name) and str(captain_name).strip() != '':
                    captain_match = players_df[players_df['Name'].str.strip() == str(captain_name).strip()]
                    if not captain_match.empty:
                        player_id = captain_match.iloc[0]['PlayerID']
                        base_tokens = captain_match.iloc[0]['BaseTokens']
                        f.write(f"UPDATE players SET status = 'Sold', sold_to = '{team_name}', sold_price = {base_tokens} WHERE player_id = '{player_id}';\n")
                
                # Find and assign vice-captain
                if not pd.isna(vice_captain_name) and str(vice_captain_name).strip() != '':
                    vice_captain_match = players_df[players_df['Name'].str.strip() == str(vice_captain_name).strip()]
                    if not vice_captain_match.empty:
                        player_id = vice_captain_match.iloc[0]['PlayerID']
                        base_tokens = vice_captain_match.iloc[0]['BaseTokens']
                        f.write(f"UPDATE players SET status = 'Sold', sold_to = '{team_name}', sold_price = {base_tokens} WHERE player_id = '{player_id}';\n")
            
            f.write("\n-- Verify captain assignments\n")
            f.write("SELECT player_id, name, role, is_captain, is_vice_captain, status, sold_to, sold_price FROM players WHERE is_captain = TRUE OR is_vice_captain = TRUE ORDER BY sold_to, is_captain DESC;\n")
        
        print(f"✅ Created: {sql_file}")
        print()
        
        # Summary
        print("📊 SUMMARY")
        print("=" * 70)
        print(f"✅ Processed {len(captains_df)} team assignments")
        print(f"✅ Marked {captains_marked} players as captains in Excel")
        print(f"✅ Marked {vice_captains_marked} players as vice-captains in Excel")
        print(f"✅ Pre-assigned {pre_assigned} players to teams (Status: Sold)")
        print(f"✅ Remaining players for auction: {len(players_df[players_df['Status'] != 'Sold'])}")
        print(f"✅ Generated SQL update script")
        print()
        print("🎯 NEXT STEPS:")
        print("  1. Run sql/update_captains.sql in Supabase")
        print("  2. Upload updated Excel to Supabase (captains will be pre-assigned)")
        print("  3. Captains/Vice-captains will NOT appear in auction")
        print("  4. React components will display captain (👑) and vice-captain (🥈) badges")
        print()
        print("✅ Captain processing completed!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = process_captains()
    if not success:
        print("\n❌ Processing failed. Please check the errors above.")
        exit(1)
