# CPL Auction Project Structure

## 📁 Organized Folder Structure

```
cplbidding/
├── 📂 src/                    # React application source code
│   ├── components/            # React components
│   ├── services/              # API services
│   └── utils/                 # Utility functions
│
├── 📂 server/                 # Express backend server
│   └── server.js
│
├── 📂 assets/                 # Static assets
│   ├── images/                # Team logos, player photos
│   └── *.xlsx                 # Generated Excel files
│
├── 📂 docs/                   # 📚 All documentation
│   ├── Setup guides
│   ├── Feature documentation
│   ├── Data management guides
│   └── Pricing strategies
│
├── 📂 sql/                    # 🗄️ All SQL scripts
│   ├── Schema definitions
│   ├── Data insertion scripts
│   └── Cleanup scripts
│
├── 📂 scripts/                # 🐍 Python utility scripts
│   ├── Data processing
│   ├── Excel generation
│   └── Price calculation
│
├── 📂 data/                   # 📊 Excel data files
│   ├── Registration data
│   ├── Editable templates
│   └── Captain assignments
│
├── 📂 supabase/               # Supabase configuration
│   └── schema.sql
│
├── 📂 public/                 # Public static files
│
├── 📂 node_modules/           # Node dependencies
│
├── cplbidding.py              # Streamlit Python app
├── package.json               # Node dependencies
├── requirements.txt           # Python dependencies
└── README.md                  # Main project README
```

## 🎯 Quick Navigation

### For Development
- **React App**: `src/` folder
- **Backend**: `server/` folder
- **Styles**: `src/index.css`

### For Documentation
- **All Guides**: `docs/` folder
- **Setup Instructions**: `docs/SUPABASE_SETUP.md`
- **Feature Guides**: `docs/CATEGORY_BIDDING_GUIDE.md`

### For Database
- **SQL Scripts**: `sql/` folder
- **Schema**: `sql/supabase-schema.sql`
- **Data Insertion**: `sql/cpl_auction_2025_insert.sql`

### For Data Management
- **Python Scripts**: `scripts/` folder
- **Excel Files**: `data/` folder
- **Process Data**: `python scripts/process_cpl_registrations.py`

## 🚀 Common Tasks

### Start Development Servers
```bash
npm start                    # React app (port 3000)
npm run server              # Backend (port 3001)
python -m streamlit run cplbidding.py  # Streamlit app
```

### Process Registration Data
```bash
python scripts/process_cpl_registrations.py
```

### Generate SQL from Excel
```bash
python scripts/create_editable_players_excel.py
# Edit data/CPL_Players_Editable.xlsx
python scripts/generate_sql_from_players_excel.py
```

### Clean Data
```bash
python scripts/clean_cpl_data.py
```

## 📚 Documentation Index

| Topic | File | Location |
|-------|------|----------|
| Setup Guide | CPL_2025_SETUP_GUIDE.md | `docs/` |
| Category Bidding | CATEGORY_BIDDING_GUIDE.md | `docs/` |
| Dual View System | DUAL_VIEW_GUIDE.md | `docs/` |
| Excel Workflow | EDITABLE_EXCEL_WORKFLOW.md | `docs/` |
| Data Cleanup | DATA_CLEANUP_GUIDE.md | `docs/` |
| Player Valuation | PLAYER_VALUATION_FRAMEWORK.md | `docs/` |

## 🗄️ SQL Scripts Index

| Purpose | File | Location |
|---------|------|----------|
| Database Schema | supabase-schema.sql | `sql/` |
| Insert Players | cpl_auction_2025_insert.sql | `sql/` |
| Cleanup Data | supabase-cleanup-scripts.sql | `sql/` |
| Master Script | insert_cpl_2025_data.sql | `sql/` |

## 🐍 Python Scripts Index

| Purpose | File | Location |
|---------|------|----------|
| Process Registrations | process_cpl_registrations.py | `scripts/` |
| Create Editable Excel | create_editable_players_excel.py | `scripts/` |
| Generate SQL | generate_sql_from_players_excel.py | `scripts/` |
| Clean Data | clean_cpl_data.py | `scripts/` |
| Price Calculator | player_pricing_calculator.py | `scripts/` |

## 📊 Data Files Index

| Purpose | File | Location |
|---------|------|----------|
| Original Registrations | Colruyt Premier League Registrations 2025.xlsx | `data/` |
| Editable Players | CPL_Players_Editable.xlsx | `data/` |
| Captain Assignments | captain_team_assignments.xlsx | `data/` |
| Processed Data | CPL_Auction_Data_2025.xlsx | `assets/` |

## ✨ Benefits of This Structure

✅ **Organized**: Easy to find files by type
✅ **Clean Root**: Only essential files in root
✅ **Documented**: README in each folder
✅ **Maintainable**: Clear separation of concerns
✅ **Scalable**: Easy to add new files

## 🔍 Finding Files

- **Need documentation?** → Check `docs/` folder
- **Need SQL?** → Check `sql/` folder
- **Need to process data?** → Check `scripts/` folder
- **Need Excel files?** → Check `data/` folder
- **Need source code?** → Check `src/` folder

Everything is organized and nothing is deleted! 🎉