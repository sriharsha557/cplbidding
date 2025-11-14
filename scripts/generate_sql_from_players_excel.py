#!/usr/bin/env python3
"""
Generate SQL INSERT statements from edited players Excel file
Reads CPL_Players_Editable.xlsx and creates Supabase-ready SQL
"""

import pandas as pd
from pathlib import Path

def generate_sql_from_excel():
    """Generate SQL INSERT statements from edited Excel"""
    
    print("🔄 Generating SQL from Edited Players Excel...")
    print("=" * 70)
    
    input_file = Path('CPL_Players_Editable.xlsx')
    
    if not input_file.exists():
        print(f"❌ Error: {input_file} not found!")
        print("   Please run: python create_editable_players_excel.py first")
        return False
    
    try:
        # Read the edited players data
        players_df = pd.read_excel(input_file, sheet_name='Players')
        
        print(f"📊 Loaded {len(players_df)} players from Excel")
        print()
        
        # Validate data
        print("🔍 Validating data...")
        
        valid_roles = ['Batsman', 'Bowler', 'All-rounder', 'WicketKeeper']
        invalid_roles = players_df[~players_df['Role'].isin(valid_roles)]
        
        if len(invalid_roles) > 0:
            print("❌ ERROR: Invalid roles found!")
            print(invalid_roles[['Name', 'Role']])
            print()
            print("Valid roles are: Batsman, Bowler, All-rounder, WicketKeeper")
            return False
        
        # Check for missing required fields
        required_fields = ['PlayerID', 'Name', 'Role', 'BaseTokens']
        for field in required_fields:
            if players_df[field].isnull().any():
                print(f"❌ ERROR: Missing values in {field} column!")
                return False
        
        print("✅ All validations passed")
        print()
        
        # Calculate auction order based on role
        role_order_map = {'Batsman': 1, 'Bowler': 2, 'All-rounder': 3, 'WicketKeeper': 4}
        players_df['auction_order'] = players_df['Role'].map(role_order_map) * 1000 + players_df.index
        
        # Sort by auction order
        players_df = players_df.sort_values('auction_order')
        
        # Generate SQL
        print("📝 Generating SQL INSERT statements...")
        
        sql_file = Path('CPL_Players_Final_Insert.sql')
        
        with open(sql_file, 'w', encoding='utf-8') as f:
            f.write("-- =====================================================\n")
            f.write("-- CPL 2025 Players - Final Data\n")
            f.write("-- Generated from CPL_Players_Editable.xlsx\n")
            f.write(f"-- Total Players: {len(players_df)}\n")
            f.write("-- =====================================================\n\n")
            
            # Role distribution
            f.write("-- Role Distribution:\n")
            for role in valid_roles:
                count = len(players_df[players_df['Role'] == role])
                f.write(f"-- {role}: {count} players\n")
            f.write("\n")
            
            # Token statistics
            f.write("-- Base Token Statistics:\n")
            f.write(f"-- Min: {players_df['BaseTokens'].min()} tokens\n")
            f.write(f"-- Max: {players_df['BaseTokens'].max()} tokens\n")
            f.write(f"-- Avg: {players_df['BaseTokens'].mean():.1f} tokens\n")
            f.write("\n")
            
            f.write("-- =====================================================\n")
            f.write("-- STEP 1: Clear existing data (OPTIONAL - backup first!)\n")
            f.write("-- =====================================================\n")
            f.write("-- DELETE FROM auction_history;\n")
            f.write("-- DELETE FROM players;\n")
            f.write("-- ALTER SEQUENCE players_id_seq RESTART WITH 1;\n\n")
            
            f.write("-- =====================================================\n")
            f.write("-- STEP 2: Insert players\n")
            f.write("-- =====================================================\n\n")
            
            f.write("INSERT INTO players (\n")
            f.write("  player_id, name, role, department, base_tokens,\n")
            f.write("  photo_filename, status, auction_order\n")
            f.write(") VALUES\n")
            
            values = []
            for _, row in players_df.iterrows():
                # Escape single quotes in names
                clean_name = str(row['Name']).replace("'", "''")
                clean_dept = str(row['Department']).replace("'", "''")
                
                value = (
                    f"('{row['PlayerID']}', '{clean_name}', '{row['Role']}', "
                    f"'{clean_dept}', {int(row['BaseTokens'])}, "
                    f"'{row['PhotoFileName']}', '{row['Status']}', {int(row['auction_order'])})"
                )
                values.append(value)
            
            f.write(',\n'.join(values))
            f.write(';\n\n')
            
            f.write("-- =====================================================\n")
            f.write("-- STEP 3: Verify insertion\n")
            f.write("-- =====================================================\n\n")
            
            f.write("-- Check total count\n")
            f.write("SELECT COUNT(*) as total_players FROM players;\n")
            f.write(f"-- Expected: {len(players_df)}\n\n")
            
            f.write("-- Check role distribution\n")
            f.write("SELECT role, COUNT(*) as count, \n")
            f.write("       MIN(base_tokens) as min_tokens,\n")
            f.write("       MAX(base_tokens) as max_tokens,\n")
            f.write("       ROUND(AVG(base_tokens), 1) as avg_tokens\n")
            f.write("FROM players \n")
            f.write("GROUP BY role \n")
            f.write("ORDER BY role;\n\n")
            
            f.write("-- Check auction order\n")
            f.write("SELECT role, \n")
            f.write("       MIN(auction_order) as first_order,\n")
            f.write("       MAX(auction_order) as last_order\n")
            f.write("FROM players\n")
            f.write("GROUP BY role\n")
            f.write("ORDER BY MIN(auction_order);\n\n")
            
            f.write("-- Preview first 10 players by auction order\n")
            f.write("SELECT auction_order, player_id, name, role, base_tokens\n")
            f.write("FROM players\n")
            f.write("ORDER BY auction_order\n")
            f.write("LIMIT 10;\n\n")
            
            f.write("-- =====================================================\n")
            f.write("-- READY FOR AUCTION!\n")
            f.write("-- =====================================================\n")
        
        print(f"✅ Created: {sql_file}")
        print()
        
        # Generate summary report
        print("📊 GENERATION SUMMARY")
        print("=" * 70)
        print(f"Total Players: {len(players_df)}")
        print()
        print("Role Distribution:")
        for role in valid_roles:
            role_data = players_df[players_df['Role'] == role]
            if len(role_data) > 0:
                print(f"  {role}: {len(role_data)} players")
                print(f"    Tokens: {role_data['BaseTokens'].min()}-{role_data['BaseTokens'].max()} "
                      f"(avg: {role_data['BaseTokens'].mean():.1f})")
        print()
        print("Base Token Statistics:")
        print(f"  Min: {players_df['BaseTokens'].min()} tokens")
        print(f"  Max: {players_df['BaseTokens'].max()} tokens")
        print(f"  Avg: {players_df['BaseTokens'].mean():.1f} tokens")
        print()
        print("Auction Order:")
        print(f"  Batsmen: {players_df[players_df['Role']=='Batsman']['auction_order'].min()}-"
              f"{players_df[players_df['Role']=='Batsman']['auction_order'].max()}")
        print(f"  Bowlers: {players_df[players_df['Role']=='Bowler']['auction_order'].min()}-"
              f"{players_df[players_df['Role']=='Bowler']['auction_order'].max()}")
        print(f"  All-rounders: {players_df[players_df['Role']=='All-rounder']['auction_order'].min()}-"
              f"{players_df[players_df['Role']=='All-rounder']['auction_order'].max()}")
        print(f"  Wicketkeepers: {players_df[players_df['Role']=='WicketKeeper']['auction_order'].min()}-"
              f"{players_df[players_df['Role']=='WicketKeeper']['auction_order'].max()}")
        print()
        print("🎯 NEXT STEPS:")
        print("  1. Review the generated SQL: CPL_Players_Final_Insert.sql")
        print("  2. Run the SQL in Supabase SQL Editor")
        print("  3. Verify data with the included SELECT queries")
        print("  4. Load data in your auction app")
        print()
        print("✅ SQL generation completed successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = generate_sql_from_excel()
    if not success:
        print("\n❌ SQL generation failed. Please check the errors above.")
        exit(1)