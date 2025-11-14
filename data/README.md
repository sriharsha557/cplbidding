# Data Files

This folder contains Excel data files for the auction system.

## Registration Data
- `Colruyt Premier League Registrations 2025.xlsx` - Original registration data
  - PLAYERS tab: 94 players for auction
  - CAPTAINS tab: 23 captains for team assignment

## Editable Templates
- `CPL_Players_Editable.xlsx` - Editable player data template
  - Edit roles and base tokens
  - Generate SQL from this file

- `captain_team_assignments.xlsx` - Captain assignment template
  - Assign captains to teams
  - Plan captain/vice-captain pairs

## Generated Data
- `CPL_Auction_Data_2025.xlsx` - Processed auction-ready data (in assets folder)

## Workflow
1. Edit `CPL_Players_Editable.xlsx` with your changes
2. Run `python scripts/generate_sql_from_players_excel.py`
3. Use generated SQL in Supabase
4. Assign captains using `captain_team_assignments.xlsx`

**Note**: Keep original registration file as backup!