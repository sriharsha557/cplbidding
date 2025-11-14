#!/usr/bin/env python3
"""
CPL Data Cleaning Script
Cleans the Players tab in Cpl_data.xlsx to prepare for auction system
"""

import pandas as pd
import numpy as np
from pathlib import Path
import re

def clean_cpl_players_data():
    """Clean and standardize the CPL players data"""
    
    print("🧹 Starting CPL Data Cleaning Process...")
    print("=" * 50)
    
    # Read the Excel file
    excel_path = Path('assets/Cpl_data.xlsx')
    if not excel_path.exists():
        print(f"❌ Error: {excel_path} not found!")
        return False
    
    try:
        # Read the Players sheet
        df = pd.read_excel(excel_path, sheet_name='Players')
        print(f"📊 Loaded {len(df)} players from Excel")
        
        # Create a backup
        df_original = df.copy()
        
        print("\n🔍 Original Data Issues Found:")
        print(f"- Shape: {df.shape}")
        print(f"- Null PhotoFileName: {df['PhotoFileName'].isnull().sum()}")
        print(f"- Role distribution: {df['Role'].value_counts().to_dict()}")
        
        # 1. Fix Role Values (Critical for database constraint)
        print("\n🔧 Fixing Role Values...")
        role_mapping = {
            'Wicket Keeper': 'WicketKeeper',  # Fix space issue
            'wicket keeper': 'WicketKeeper',
            'WICKET KEEPER': 'WicketKeeper',
            'wicketkeeper': 'WicketKeeper',
            'All-rounder': 'All-rounder',     # Keep as is (correct)
            'all-rounder': 'All-rounder',
            'ALL-ROUNDER': 'All-rounder',
            'AllRounder': 'All-rounder',
            'Batsman': 'Batsman',             # Keep as is (correct)
            'batsman': 'Batsman',
            'BATSMAN': 'Batsman',
            'Bowler': 'Bowler',               # Keep as is (correct)
            'bowler': 'Bowler',
            'BOWLER': 'Bowler'
        }
        
        # Apply role mapping
        df['Role'] = df['Role'].map(role_mapping).fillna(df['Role'])
        
        # Check for any unmapped roles
        valid_roles = ['Batsman', 'Bowler', 'All-rounder', 'WicketKeeper']
        invalid_roles = df[~df['Role'].isin(valid_roles)]['Role'].unique()
        if len(invalid_roles) > 0:
            print(f"⚠️  Warning: Found invalid roles: {invalid_roles}")
            # Map any remaining invalid roles
            for role in invalid_roles:
                if 'bat' in role.lower():
                    df.loc[df['Role'] == role, 'Role'] = 'Batsman'
                elif 'bowl' in role.lower():
                    df.loc[df['Role'] == role, 'Role'] = 'Bowler'
                elif 'keep' in role.lower() or 'wicket' in role.lower():
                    df.loc[df['Role'] == role, 'Role'] = 'WicketKeeper'
                elif 'all' in role.lower() or 'round' in role.lower():
                    df.loc[df['Role'] == role, 'Role'] = 'All-rounder'
        
        print(f"✅ Role values standardized")
        
        # 2. Clean Player Names
        print("\n🔧 Cleaning Player Names...")
        # Remove extra spaces and standardize capitalization
        df['Name'] = df['Name'].str.strip()
        df['Name'] = df['Name'].str.title()  # Proper case
        
        # Fix common name issues
        df['Name'] = df['Name'].str.replace(r'\s+', ' ', regex=True)  # Multiple spaces to single
        df['Name'] = df['Name'].str.replace(r'\.+', '.', regex=True)  # Multiple dots to single
        
        print(f"✅ Player names cleaned")
        
        # 3. Validate and Clean PlayerID
        print("\n🔧 Validating Player IDs...")
        # Check for duplicates
        duplicates = df[df['PlayerID'].duplicated()]['PlayerID'].unique()
        if len(duplicates) > 0:
            print(f"⚠️  Warning: Found duplicate PlayerIDs: {duplicates}")
            # Make unique by adding suffix
            df['PlayerID'] = df.groupby('PlayerID').cumcount().astype(str).replace('0', '') + df['PlayerID']
        
        # Ensure PlayerID is string and clean
        df['PlayerID'] = df['PlayerID'].astype(str).str.strip().str.upper()
        
        print(f"✅ Player IDs validated")
        
        # 4. Optimize Base Tokens Using Valuation Framework
        print("\n🔧 Optimizing Base Tokens...")
        
        def calculate_optimized_tokens(row):
            """Calculate optimized base tokens based on role and current value"""
            role = row['Role']
            current_tokens = row['BaseTokens']
            
            # Define optimized ranges based on current distribution
            token_ranges = {
                'Batsman': {
                    'min': 15, 'max': 70,
                    'tiers': {
                        'excellent': (50, 70),
                        'good': (30, 49), 
                        'average': (15, 29)
                    }
                },
                'Bowler': {
                    'min': 12, 'max': 65,
                    'tiers': {
                        'excellent': (45, 65),
                        'good': (25, 44),
                        'average': (12, 24)
                    }
                },
                'All-rounder': {
                    'min': 20, 'max': 80,
                    'tiers': {
                        'excellent': (60, 80),
                        'good': (35, 59),
                        'average': (20, 34)
                    }
                },
                'WicketKeeper': {
                    'min': 12, 'max': 60,
                    'tiers': {
                        'excellent': (40, 60),
                        'good': (22, 39),
                        'average': (12, 21)
                    }
                }
            }
            
            if role not in token_ranges:
                return current_tokens
            
            role_range = token_ranges[role]
            
            # Categorize current token value and optimize
            if current_tokens >= 50:
                # High value player - excellent tier
                tier = role_range['tiers']['excellent']
                return min(max(current_tokens, tier[0]), tier[1])
            elif current_tokens >= 30:
                # Medium value player - good tier  
                tier = role_range['tiers']['good']
                return min(max(current_tokens, tier[0]), tier[1])
            else:
                # Lower value player - average tier
                tier = role_range['tiers']['average']
                return min(max(current_tokens, tier[0]), tier[1])
        
        # Apply optimization
        df['BaseTokens_Original'] = df['BaseTokens']  # Keep original for reference
        df['BaseTokens'] = df.apply(calculate_optimized_tokens, axis=1)
        
        print(f"✅ Base tokens optimized")
        
        # 5. Handle Missing Photo Filenames
        print("\n🔧 Handling Missing Photo Filenames...")
        
        def generate_photo_filename(row):
            """Generate a photo filename based on player name"""
            if pd.notna(row['PhotoFileName']) and row['PhotoFileName'].strip():
                return row['PhotoFileName']
            
            # Generate from name
            name_clean = re.sub(r'[^a-zA-Z0-9\s]', '', row['Name'])
            name_parts = name_clean.lower().split()
            if len(name_parts) >= 2:
                filename = f"{name_parts[0]}_{name_parts[-1]}.jpg"
            else:
                filename = f"{name_parts[0]}.jpg" if name_parts else f"player_{row['PlayerID']}.jpg"
            
            return filename
        
        df['PhotoFileName'] = df.apply(generate_photo_filename, axis=1)
        
        print(f"✅ Photo filenames generated for missing entries")
        
        # 6. Add Department Column (for consistency with schema)
        print("\n🔧 Adding Department Column...")
        
        department_mapping = {
            'Batsman': 'Batting',
            'Bowler': 'Bowling', 
            'All-rounder': 'All-rounder',
            'WicketKeeper': 'Wicket Keeping'
        }
        
        df['Department'] = df['Role'].map(department_mapping)
        
        print(f"✅ Department column added")
        
        # 7. Reorder and finalize columns
        print("\n🔧 Finalizing Data Structure...")
        
        # Ensure proper column order
        final_columns = ['PlayerID', 'Name', 'Role', 'BaseTokens', 'PhotoFileName', 'Department']
        df = df[final_columns]
        
        # Sort by Role (auction order) then by BaseTokens (descending)
        role_order = ['Batsman', 'Bowler', 'All-rounder', 'WicketKeeper']
        df['RoleOrder'] = df['Role'].map({role: i for i, role in enumerate(role_order)})
        df = df.sort_values(['RoleOrder', 'BaseTokens'], ascending=[True, False])
        df = df.drop('RoleOrder', axis=1)
        
        print(f"✅ Data structure finalized")
        
        # 8. Generate Summary Report
        print("\n📊 CLEANING SUMMARY REPORT")
        print("=" * 50)
        
        print(f"Total Players: {len(df)}")
        print(f"Role Distribution:")
        for role, count in df['Role'].value_counts().items():
            print(f"  {role}: {count} players")
        
        print(f"\nBase Tokens by Role:")
        for role in role_order:
            role_data = df[df['Role'] == role]['BaseTokens']
            if len(role_data) > 0:
                print(f"  {role}: {role_data.min()}-{role_data.max()} tokens (avg: {role_data.mean():.1f})")
        
        print(f"\nData Quality:")
        print(f"  ✅ All roles valid: {df['Role'].isin(valid_roles).all()}")
        print(f"  ✅ No missing names: {df['Name'].notna().all()}")
        print(f"  ✅ No missing photo filenames: {df['PhotoFileName'].notna().all()}")
        print(f"  ✅ All base tokens positive: {(df['BaseTokens'] > 0).all()}")
        
        # 9. Save cleaned data
        print("\n💾 Saving Cleaned Data...")
        
        # Create backup of original
        backup_path = Path('assets/Cpl_data_backup.xlsx')
        if not backup_path.exists():
            df_original.to_excel(backup_path, sheet_name='Players_Original', index=False)
            print(f"✅ Original data backed up to {backup_path}")
        
        # Save cleaned data to new file (avoid permission issues)
        cleaned_path = Path('assets/Cpl_data_cleaned.xlsx')
        with pd.ExcelWriter(cleaned_path, engine='openpyxl') as writer:
            # Read teams data to preserve it
            teams_df = pd.read_excel(excel_path, sheet_name='Teams')
            teams_df.to_excel(writer, sheet_name='Teams', index=False)
            
            # Write cleaned players data
            df.to_excel(writer, sheet_name='Players', index=False)
        
        print(f"✅ Cleaned data saved to {cleaned_path}")
        
        # 10. Generate SQL Insert Statements
        print("\n📝 Generating SQL Insert Statements...")
        
        sql_file = Path('cleaned_players_insert.sql')
        with open(sql_file, 'w') as f:
            f.write("-- Cleaned CPL Players Data - Ready for Supabase\n")
            f.write("-- Generated automatically from clean_cpl_data.py\n\n")
            
            f.write("-- Clear existing players (optional)\n")
            f.write("-- DELETE FROM players;\n\n")
            
            f.write("-- Insert cleaned player data\n")
            f.write("INSERT INTO players (player_id, name, role, base_tokens, photo_filename, department, status) VALUES\n")
            
            values = []
            for _, row in df.iterrows():
                # Escape single quotes in names
                clean_name = row['Name'].replace("'", "''")
                values.append(f"('{row['PlayerID']}', '{clean_name}', '{row['Role']}', {row['BaseTokens']}, '{row['PhotoFileName']}', '{row['Department']}', 'Available')")
            
            f.write(',\n'.join(values))
            f.write(';\n\n')
            
            f.write("-- Verify insertion\n")
            f.write("SELECT role, COUNT(*) as player_count FROM players GROUP BY role ORDER BY role;\n")
        
        print(f"✅ SQL insert statements saved to {sql_file}")
        
        print("\n🎉 DATA CLEANING COMPLETED SUCCESSFULLY!")
        print("=" * 50)
        print("Next Steps:")
        print("1. Review the cleaned data in Excel")
        print("2. Use the generated SQL file to insert into Supabase")
        print("3. Upload player photos to assets/images/ folder")
        print("4. Test the auction system with cleaned data")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during cleaning: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = clean_cpl_players_data()
    if success:
        print("\n✅ All done! Your CPL data is ready for the auction system.")
    else:
        print("\n❌ Cleaning failed. Please check the errors above.")