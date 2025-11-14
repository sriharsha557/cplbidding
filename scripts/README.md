# Utility Scripts

This folder contains Python utility scripts for data processing and management.

## Data Processing
- `process_cpl_registrations.py` - Process registration Excel into auction data
- `clean_cpl_data.py` - Clean and validate player data

## Excel Management
- `create_editable_players_excel.py` - Generate editable Excel template
- `generate_sql_from_players_excel.py` - Generate SQL from edited Excel

## Pricing Tools
- `player_pricing_calculator.py` - Bulk player price calculation

## Usage

### Process Registration Data
```bash
python scripts/process_cpl_registrations.py
```

### Create Editable Excel
```bash
python scripts/create_editable_players_excel.py
```

### Generate SQL from Excel
```bash
python scripts/generate_sql_from_players_excel.py
```

### Clean Data
```bash
python scripts/clean_cpl_data.py
```

All scripts include built-in help and validation.