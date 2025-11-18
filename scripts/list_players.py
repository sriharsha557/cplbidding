#!/usr/bin/env python3
"""
List all player names from the Excel file
"""

import pandas as pd
from pathlib import Path

players_file = Path('data/CPL_Players_Editable.xlsx')
players_df = pd.read_excel(players_file, sheet_name='Players')

print(f"\nTotal Players: {len(players_df)}\n")
print("PlayerID | Name")
print("-" * 80)

for _, row in players_df.iterrows():
    print(f"{row['PlayerID']} | {row['Name']}")

print("\n" + "=" * 80)
print(f"Total: {len(players_df)} players")
