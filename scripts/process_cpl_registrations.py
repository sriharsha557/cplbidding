#!/usr/bin/env python3
"""
CPL Registration Data Processor
Processes Colruyt Premier League Registrations 2025.xlsx for auction system
- Extracts players for auction (from PLAYERS tab)
- Extracts captains for direct team assignment (from CAPTAINS tab)
- Maps roles to database-compliant values
- Generates auction-ready Excel file
"""

import pandas as pd
import numpy as np
from pathlib import Path
import re

def map_role_to_category(preferred_role, secondary_role=None):
    """
    Map player roles to database-compliant categories
    Priority: Preferred Role > Secondary Role
    """
    # Combine roles for analysis
    roles_text = str(preferred_role).lower()
    if pd.notna(secondary_role):
        roles_text += ' ' + str(secondary_role).lower()
    
    # Role mapping logic
    if 'wicket' in roles_text or 'keeper' in roles_text:
        return 'WicketKeeper'
    elif 'batting all' in roles_text or 'bat all' in roles_text:
        return 'All-rounder'
    elif 'bowling all' in roles_text or 'bowl all' in roles_text:
        return 'All-rounder'
    elif 'all' in roles_text and 'round' in roles_text:
        return 'All-rounder'
    elif 'batsman' in roles_text or 'batting' in roles_text or 'bats' in roles_text:
        return 'Batsman'
    elif 'bowler' in roles_text or 'bowling' in roles_text or 'bowl' in roles_text:
        return 'Bowler'
    elif 'fielder' in roles_text:
        # Fielder defaults to Batsman
        return 'Batsman'
    else:
        # Default to All-rounder for flexibility
        return 'All-rounder'

def calculate_base_tokens(role, is_captain=False):
    """
    Calculate base tokens based on role and captain status
    Captains get premium pricing
    """
    base_ranges = {
        'Batsman': (25, 45),
        'Bowler': (25, 45),
        'All-rounder': (30, 50),
        'WicketKeeper': (25, 45)
    }
    
    min_val, max_val = base_ranges.get(role, (30, 50))
    
    if is_captain:
        # Captains get premium (top of range)
        return max_val
    else:
        # Regular players get mid-range
        return (min_val + max_val) // 2

def generate_player_id(name, employee_id):
    """Generate unique player ID"""
    # Use employee ID if available, otherwise generate from name
    if pd.notna(employee_id) and str(employee_id).strip():
        return str(employee_id).strip().upper()
    else:
        # Generate from name
        name_clean = re.sub(r'[^a-zA-Z0-9]', '', name)
        return name_clean[:8].upper()

def generate_photo_filename(name):
    """Generate photo filename from player name"""
    name_clean = re.sub(r'[^a-zA-Z0-9\s]', '', name)
    name_parts = name_clean.lower().split()
    if len(name_parts) >= 2:
        return f"{name_parts[0]}_{name_parts[-1]}.jpg"
    else:
        return f"{name_parts[0]}.jpg" if name_parts else "player.jpg"

def process_cpl_registrations():
    """Main processing function"""
    
    print("🏏 CPL Registration Data Processor")
    print("=" * 70)
    
    input_file = Path('Colruyt Premier League Registrations 2025.xlsx')
    
    if not input_file.exists():
        print(f"❌ Error: {input_file} not found!")
        return False
    
    try:
        # Read the Excel file
        xls = pd.ExcelFile(input_file)
        print(f"📊 Found sheets: {xls.sheet_names}")
        print()
        
        # 1. Process PLAYERS tab (for auction)
        print("👥 Processing PLAYERS tab...")
        players_df = pd.read_excel(input_file, sheet_name='PLAYERS')
        print(f"   Loaded {len(players_df)} players for auction")
        
        # Clean and process players
        players_processed = []
        for idx, row in players_df.iterrows():
            # Map role to category
            role = map_role_to_category(row['Preferred Role'], row.get('Secondary Role (if any)'))
            
            # Generate player data
            player_data = {
                'PlayerID': generate_player_id(row['Name'], row['Employee ID']),
                'Name': row['Name'].strip(),
                'Role': role,
                'BaseTokens': calculate_base_tokens(role, is_captain=False),
                'PhotoFileName': generate_photo_filename(row['Name']),
                'Department': {
                    'Batsman': 'Batting',
                    'Bowler': 'Bowling',
                    'All-rounder': 'All-rounder',
                    'WicketKeeper': 'Wicket Keeping'
                }[role],
                'EmployeeID': row['Employee ID'],
                'ContactNumber': row['Contact Number'],
                'PreferredRole': row['Preferred Role'],
                'SecondaryRole': row.get('Secondary Role (if any)', '')
            }
            players_processed.append(player_data)
        
        players_auction_df = pd.DataFrame(players_processed)
        
        # 2. Process CAPTAINS tab (for direct assignment)
        print("👑 Processing CAPTAINS tab...")
        captains_df = pd.read_excel(input_file, sheet_name='CAPTAINS')
        print(f"   Loaded {len(captains_df)} captains")
        
        # Clean and process captains
        captains_processed = []
        for idx, row in captains_df.iterrows():
            # Map role to category
            role = map_role_to_category(row['Preferred Role'], row.get('Secondary Role (if any)'))
            
            # Generate captain data
            captain_data = {
                'PlayerID': generate_player_id(row['Name'], row['Employee ID']),
                'Name': row['Name'].strip(),
                'Role': role,
                'BaseTokens': calculate_base_tokens(role, is_captain=True),
                'PhotoFileName': generate_photo_filename(row['Name']),
                'Department': {
                    'Batsman': 'Batting',
                    'Bowler': 'Bowling',
                    'All-rounder': 'All-rounder',
                    'WicketKeeper': 'Wicket Keeping'
                }[role],
                'EmployeeID': row['Employee ID'],
                'ContactNumber': row['Contact Number'],
                'PreferredRole': row['Preferred Role'],
                'SecondaryRole': row.get('Secondary Role (if any)', ''),
                'IsCaptain': True
            }
            captains_processed.append(captain_data)
        
        captains_assignment_df = pd.DataFrame(captains_processed)
        
        # 3. Generate role distribution report
        print()
        print("📊 ROLE DISTRIBUTION ANALYSIS")
        print("=" * 70)
        
        print("\n🎯 Players for Auction:")
        print(players_auction_df['Role'].value_counts())
        print(f"Total: {len(players_auction_df)} players")
        
        print("\n👑 Captains for Direct Assignment:")
        print(captains_assignment_df['Role'].value_counts())
        print(f"Total: {len(captains_assignment_df)} captains")
        
        # 4. Generate auction-ready Excel file
        print()
        print("💾 Generating auction-ready files...")
        
        output_file = Path('assets/CPL_Auction_Data_2025.xlsx')
        
        with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
            # Players sheet (for auction)
            auction_columns = ['PlayerID', 'Name', 'Role', 'BaseTokens', 'PhotoFileName', 'Department']
            players_auction_df[auction_columns].to_excel(writer, sheet_name='Players', index=False)
            
            # Captains sheet (for reference and team assignment)
            captains_assignment_df.to_excel(writer, sheet_name='Captains', index=False)
            
            # Full data sheet (with all details)
            all_players = pd.concat([players_auction_df, captains_assignment_df], ignore_index=True)
            all_players.to_excel(writer, sheet_name='Complete_Data', index=False)
        
        print(f"✅ Created: {output_file}")
        
        # 5. Generate SQL insert statements
        print()
        print("📝 Generating SQL insert statements...")
        
        sql_file = Path('cpl_auction_2025_insert.sql')
        with open(sql_file, 'w', encoding='utf-8') as f:
            f.write("-- CPL Auction 2025 - Player Data\n")
            f.write("-- Generated from Colruyt Premier League Registrations 2025.xlsx\n\n")
            
            f.write("-- =====================================================\n")
            f.write("-- PLAYERS FOR AUCTION (94 players)\n")
            f.write("-- =====================================================\n\n")
            
            # Sort players by auction order (role-based)
            role_order = {'Batsman': 1, 'Bowler': 2, 'All-rounder': 3, 'WicketKeeper': 4}
            players_auction_df['auction_order'] = players_auction_df['Role'].map(role_order) * 1000 + players_auction_df.index
            players_auction_df = players_auction_df.sort_values('auction_order')
            
            f.write("INSERT INTO players (player_id, name, role, department, base_tokens, photo_filename, status, auction_order) VALUES\n")
            
            values = []
            for _, row in players_auction_df.iterrows():
                clean_name = row['Name'].replace("'", "''")
                values.append(
                    f"('{row['PlayerID']}', '{clean_name}', '{row['Role']}', '{row['Department']}', "
                    f"{row['BaseTokens']}, '{row['PhotoFileName']}', 'Available', {row['auction_order']})"
                )
            
            f.write(',\n'.join(values))
            f.write(';\n\n')
            
            f.write("-- =====================================================\n")
            f.write("-- CAPTAINS (23 captains - for direct team assignment)\n")
            f.write("-- =====================================================\n")
            f.write("-- These players should be assigned directly to teams\n")
            f.write("-- as Captain/Vice-Captain pairs before auction starts\n\n")
            
            f.write("-- Captain data for reference:\n")
            for _, row in captains_assignment_df.iterrows():
                f.write(f"-- {row['Name']} ({row['Role']}) - {row['BaseTokens']} tokens\n")
            
            f.write("\n-- Verification queries\n")
            f.write("SELECT role, COUNT(*) as player_count FROM players GROUP BY role ORDER BY role;\n")
            f.write("SELECT COUNT(*) as total_players FROM players;\n")
        
        print(f"✅ Created: {sql_file}")
        
        # 6. Generate captain assignment template
        print()
        print("📋 Generating captain assignment template...")
        
        # Create team assignment template
        num_teams = 8  # Adjust based on your needs
        captains_per_team = len(captains_assignment_df) // num_teams
        
        assignment_file = Path('captain_team_assignments.xlsx')
        
        # Create team assignment structure
        teams_data = []
        for i in range(num_teams):
            teams_data.append({
                'TeamID': f'CPL_T{i+1:02d}',
                'TeamName': f'Team {i+1}',
                'Captain': '',
                'ViceCaptain': '',
                'LogoFile': f'team{i+1}_logo.png',
                'TokensLeft': 1200,
                'MaxTokens': 1200,
                'MaxSquadSize': 15
            })
        
        teams_df = pd.DataFrame(teams_data)
        
        with pd.ExcelWriter(assignment_file, engine='openpyxl') as writer:
            teams_df.to_excel(writer, sheet_name='Teams', index=False)
            captains_assignment_df[['Name', 'Role', 'BaseTokens', 'EmployeeID']].to_excel(
                writer, sheet_name='Available_Captains', index=False
            )
        
        print(f"✅ Created: {assignment_file}")
        
        # 7. Generate summary report
        print()
        print("📊 PROCESSING SUMMARY")
        print("=" * 70)
        print(f"✅ Players for auction: {len(players_auction_df)}")
        print(f"✅ Captains for assignment: {len(captains_assignment_df)}")
        print(f"✅ Total participants: {len(all_players)}")
        print()
        print("Role Distribution (Auction Players):")
        for role, count in players_auction_df['Role'].value_counts().items():
            print(f"   {role}: {count} players")
        print()
        print("Base Token Range (Auction Players):")
        print(f"   Min: {players_auction_df['BaseTokens'].min()} tokens")
        print(f"   Max: {players_auction_df['BaseTokens'].max()} tokens")
        print(f"   Avg: {players_auction_df['BaseTokens'].mean():.1f} tokens")
        print()
        
        print("📁 Generated Files:")
        print(f"   1. {output_file} - Auction-ready Excel file")
        print(f"   2. {sql_file} - SQL insert statements")
        print(f"   3. {assignment_file} - Captain assignment template")
        print()
        
        print("🎯 NEXT STEPS:")
        print("=" * 70)
        print("1. Review the generated Excel file: CPL_Auction_Data_2025.xlsx")
        print("2. Assign captains to teams using: captain_team_assignments.xlsx")
        print("3. Upload player photos to assets/images/ folder")
        print("4. Run SQL script to insert players into Supabase")
        print("5. Load the auction data in your app")
        print()
        print("🎉 Processing completed successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = process_cpl_registrations()
    if not success:
        print("\n❌ Processing failed. Please check the errors above.")
        exit(1)