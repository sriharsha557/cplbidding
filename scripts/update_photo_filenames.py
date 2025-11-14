#!/usr/bin/env python3
"""
Update Photo Filenames to Use Player IDs
Updates Excel and generates SQL to update Supabase
"""

import pandas as pd
from pathlib import Path
import shutil

def update_photo_filenames():
    """Update photo filenames to use player_id instead of name-based"""
    
    print("📸 Updating Photo Filenames to Player IDs...")
    print("=" * 70)
    
    # Read the editable players Excel
    excel_file = Path('data/CPL_Players_Editable.xlsx')
    
    if not excel_file.exists():
        print(f"❌ Error: {excel_file} not found!")
        return False
    
    try:
        # Read players data
        players_df = pd.read_excel(excel_file, sheet_name='Players')
        
        print(f"📊 Loaded {len(players_df)} players")
        print()
        
        # Update PhotoFileName to use PlayerID
        print("🔧 Updating photo filenames to use Player IDs...")
        players_df['PhotoFileName'] = players_df['PlayerID'] + '.jpg'
        
        print("✅ Photo filenames updated")
        print()
        
        # Save updated Excel
        print("💾 Saving updated Excel file...")
        with pd.ExcelWriter(excel_file, engine='openpyxl', mode='a', if_sheet_exists='overlay') as writer:
            players_df.to_excel(writer, sheet_name='Players', index=False)
        
        print(f"✅ Updated: {excel_file}")
        print()
        
        # Generate SQL UPDATE statements for Supabase
        print("📝 Generating SQL UPDATE statements...")
        
        sql_file = Path('sql/update_photo_filenames.sql')
        with open(sql_file, 'w', encoding='utf-8') as f:
            f.write("-- Update Photo Filenames to Use Player IDs\n")
            f.write("-- Run this in Supabase SQL Editor\n\n")
            
            f.write("-- Update all player photo filenames\n")
            for _, row in players_df.iterrows():
                f.write(f"UPDATE players SET photo_filename = '{row['PlayerID']}.jpg' WHERE player_id = '{row['PlayerID']}';\n")
            
            f.write("\n-- Verify updates\n")
            f.write("SELECT player_id, name, photo_filename FROM players ORDER BY player_id LIMIT 10;\n")
        
        print(f"✅ Created: {sql_file}")
        print()
        
        # Copy player images to public folder for Vercel
        print("📁 Copying player images to public folder...")
        
        source_dir = Path('assets/images/players')
        dest_dir = Path('public/players')
        
        # Create destination directory
        dest_dir.mkdir(exist_ok=True)
        
        # Copy all player images
        copied_count = 0
        for img_file in source_dir.glob('*.jpg'):
            dest_file = dest_dir / img_file.name
            shutil.copy2(img_file, dest_file)
            copied_count += 1
        
        print(f"✅ Copied {copied_count} player images to public/players/")
        print()
        
        # Generate summary
        print("📊 SUMMARY")
        print("=" * 70)
        print(f"✅ Updated {len(players_df)} player photo filenames")
        print(f"✅ Photo format: [PlayerID].jpg (e.g., 1P0T.jpg)")
        print(f"✅ Copied {copied_count} images to public/players/")
        print(f"✅ Generated SQL update script")
        print()
        print("🎯 NEXT STEPS:")
        print("  1. Run sql/update_photo_filenames.sql in Supabase")
        print("  2. Update image paths in React components")
        print("  3. Test locally to verify images display")
        print("  4. Commit and push to git")
        print()
        print("✅ Photo filename update completed!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = update_photo_filenames()
    if not success:
        print("\n❌ Update failed. Please check the errors above.")
        exit(1)