#!/usr/bin/env python3
"""
Check what sheets are in the captain assignments file
"""

import pandas as pd
from pathlib import Path

captain_file = Path('data/captain_team_assignments.xlsx')
xl = pd.ExcelFile(captain_file)

print("\nSheets in captain_team_assignments.xlsx:")
print("=" * 70)
for sheet_name in xl.sheet_names:
    print(f"\n  Sheet: {sheet_name}")
    df = pd.read_excel(captain_file, sheet_name=sheet_name)
    print(f"  Columns: {list(df.columns)}")
    print(f"  Rows: {len(df)}")
    print("\n  Sample data:")
    print(df.head())
