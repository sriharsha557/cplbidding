import streamlit as st
import pandas as pd
from datetime import datetime
import io
from PIL import Image
import os
from pathlib import Path

# Page config
st.set_page_config(page_title="CPL Auction", layout="wide", page_icon="🏏")

# Get base directory
BASE_DIR = Path(__file__).parent if "__file__" in globals() else Path.cwd()
ASSETS_DIR = BASE_DIR / "assets"
IMAGES_DIR = ASSETS_DIR / "images"
EXCEL_PATH = ASSETS_DIR / "Cpl_data.xlsx"
PLAYERS_CSV_PATH = ASSETS_DIR / "players.csv"
TEAMS_CSV_PATH = ASSETS_DIR / "teams.csv"

# Initialize session state
if 'initialized' not in st.session_state:
    st.session_state.initialized = True
    st.session_state.auction_started = False
    st.session_state.current_player_idx = 0
    st.session_state.players_df = None
    st.session_state.teams = {}
    st.session_state.auction_history = []
    st.session_state.max_tokens = 1000
    st.session_state.max_squad_size = 15
    st.session_state.players_file_path = None
    st.session_state.teams_file_path = None
    st.session_state.unsold_players = []

# Role emojis and CPL Category Configuration
ROLE_EMOJIS = {
    'Batsman': '🏏',
    'Bowler': '🎯',
    'WicketKeeper': '🧤',
    'All-rounder': '⚡'
}

# CPL Category-based bidding configuration - Optimized Distribution
CPL_CATEGORY_BUDGETS = {
    'Batsman': {'min': 294, 'max': 420, 'min_players': 4, 'max_players': 5, 'percentage': 35},
    'Bowler': {'min': 294, 'max': 420, 'min_players': 4, 'max_players': 5, 'percentage': 35},
    'All-rounder': {'min': 168, 'max': 240, 'min_players': 3, 'max_players': 4, 'percentage': 20},
    'WicketKeeper': {'min': 84, 'max': 120, 'min_players': 2, 'max_players': 3, 'percentage': 10}
}

# Total team budget
TOTAL_TEAM_BUDGET = 1200

# Auction order by category
ROLE_ORDER = ['Batsman', 'Bowler', 'All-rounder', 'WicketKeeper']

def load_team_logo(logo_filename):
    """Load team logo from assets/images folder using filename"""
    try:
        if logo_filename and pd.notna(logo_filename) and str(logo_filename).strip():
            image_path = IMAGES_DIR / str(logo_filename)
            if image_path.exists():
                img = Image.open(image_path)
                img = img.resize((200, 200))
                return img
        return None
    except Exception as e:
        st.warning(f"Could not load logo {logo_filename}: {str(e)}")
        return None

def load_player_photo(photo_filename):
    """Load player photo from assets/images folder"""
    try:
        if photo_filename and pd.notna(photo_filename) and str(photo_filename).strip():
            image_path = IMAGES_DIR / str(photo_filename)
            if image_path.exists():
                img = Image.open(image_path)
                img = img.resize((200, 200))
                return img
        return None
    except Exception as e:
        return None

def load_cpl_logo():
    """Load CPL main logo from assets/images folder"""
    try:
        cpl_logo_path = IMAGES_DIR / "cpl.png"
        if cpl_logo_path.exists():
            img = Image.open(cpl_logo_path)
            return img
        return None
    except Exception as e:
        return None

def sort_players_by_category(players_df):
    """Sort players by CPL category order (Batsmen first, then Bowlers, etc.)"""
    # Create a copy to avoid modifying original
    sorted_df = players_df.copy()
    
    # Create role order mapping
    role_order_map = {role: i for i, role in enumerate(ROLE_ORDER)}
    
    # Add sort key column
    sorted_df['role_order'] = sorted_df['Role'].map(role_order_map)
    
    # Sort by role order, then by base tokens (descending)
    sorted_df = sorted_df.sort_values(['role_order', 'BaseTokens'], ascending=[True, False])
    
    # Remove the temporary column
    sorted_df = sorted_df.drop('role_order', axis=1)
    
    return sorted_df

def get_current_auction_phase(players_df, current_idx):
    """Get current auction phase information"""
    if current_idx >= len(players_df):
        return None
    
    current_player = players_df.iloc[current_idx]
    current_role = current_player['Role']
    
    # Count players in current category
    players_in_category = len(players_df[players_df['Role'] == current_role])
    current_player_in_category = len(players_df.iloc[:current_idx + 1][players_df.iloc[:current_idx + 1]['Role'] == current_role])
    
    return {
        'role': current_role,
        'emoji': ROLE_EMOJIS[current_role],
        'phase': ROLE_ORDER.index(current_role) + 1,
        'total_phases': len(ROLE_ORDER),
        'phase_name': f"{current_role}s Auction",
        'category_progress': {
            'current': current_player_in_category,
            'total': players_in_category,
            'percentage': (current_player_in_category / players_in_category) * 100
        },
        'budget': CPL_CATEGORY_BUDGETS[current_role]
    }

def initialize_teams_from_excel(teams_df, max_tokens, max_squad_size):
    """Initialize teams from Excel file with CPL category budgets"""
    teams = {}
    for _, row in teams_df.iterrows():
        team_name = row['TeamName']
        teams[team_name] = {
            'id': row['TeamID'],
            'logo': row['LogoFile'],  # Store logo filename from Excel
            'tokens_left': max_tokens,
            'squad': [],
            'max_tokens': max_tokens,
            'max_squad_size': max_squad_size,
            'role_count': {'Batsman': 0, 'Bowler': 0, 'WicketKeeper': 0, 'All-rounder': 0},
            'category_budgets': {
                'Batsman': {'spent': 0, 'remaining': 420},
                'Bowler': {'spent': 0, 'remaining': 420},
                'All-rounder': {'spent': 0, 'remaining': 240},
                'WicketKeeper': {'spent': 0, 'remaining': 120}
            }
        }
    return teams

def can_afford_player(team, bid_price):
    """Check if team can afford the player"""
    return team['tokens_left'] >= bid_price

def can_afford_category(team, player_role, bid_price):
    """Check if team can afford the player within category budget"""
    if 'category_budgets' not in team:
        return True
    return team['category_budgets'][player_role]['remaining'] >= bid_price

def has_role_space(team, player_role):
    """Check if team has space for this role"""
    max_players = CPL_CATEGORY_BUDGETS[player_role]['max_players']
    return team['role_count'][player_role] < max_players

def is_squad_full(team):
    """Check if team has reached max squad size"""
    return len(team['squad']) >= team['max_squad_size']

def add_player_to_team(team_name, player_data, bid_price):
    """Add player to team and update tokens"""
    team = st.session_state.teams[team_name]
    
    # Validation
    if not can_afford_player(team, bid_price):
        return False, "Insufficient tokens!"
    if is_squad_full(team):
        return False, "Squad is full!"
    if not can_afford_category(team, player_data['Role'], bid_price):
        return False, f"Insufficient {player_data['Role']} category budget!"
    if not has_role_space(team, player_data['Role']):
        return False, f"Maximum {player_data['Role']} players reached!"
    
    # Add player
    player_info = {
        'PlayerID': player_data['PlayerID'],
        'Name': player_data['Name'],
        'Role': player_data['Role'],
        'BaseTokens': player_data['BaseTokens'],
        'BidPrice': bid_price,
        'PhotoFileName': player_data.get('PhotoFileName', None)
    }
    team['squad'].append(player_info)
    team['tokens_left'] -= bid_price
    team['role_count'][player_data['Role']] += 1
    
    # Update category budget
    if 'category_budgets' in team:
        team['category_budgets'][player_data['Role']]['spent'] += bid_price
        team['category_budgets'][player_data['Role']]['remaining'] -= bid_price
    
    # Add to history
    st.session_state.auction_history.append({
        'Player': player_data['Name'],
        'Role': player_data['Role'],
        'BaseTokens': player_data['BaseTokens'],
        'SoldPrice': bid_price,
        'Team': team_name,
        'TokensLeft': team['tokens_left'],
        'SquadSize': len(team['squad'])
    })
    
    # Update Excel
    update_excel_files()
    
    return True, "Player added successfully!"

def mark_player_unsold(player_data):
    """Mark player as unsold"""
    st.session_state.unsold_players.append({
        'PlayerID': player_data['PlayerID'],
        'Name': player_data['Name'],
        'Role': player_data['Role'],
        'BaseTokens': player_data['BaseTokens'],
        'PhotoFileName': player_data.get('PhotoFileName', None)
    })
    update_excel_files()

def update_excel_files():
    """Update Excel files with auction results"""
    if st.session_state.players_file_path:
        try:
            # Update players file with sold status
            players_df = st.session_state.players_df.copy()
            
            # Add sold status columns if they don't exist
            if 'Status' not in players_df.columns:
                players_df['Status'] = 'Unsold'
            if 'SoldTo' not in players_df.columns:
                players_df['SoldTo'] = ''
            if 'SoldPrice' not in players_df.columns:
                players_df['SoldPrice'] = 0
            
            # Mark sold players
            for history in st.session_state.auction_history:
                mask = players_df['Name'] == history['Player']
                players_df.loc[mask, 'Status'] = 'Sold'
                players_df.loc[mask, 'SoldTo'] = history['Team']
                players_df.loc[mask, 'SoldPrice'] = history['SoldPrice']
            
            # Mark explicitly unsold players
            for unsold in st.session_state.unsold_players:
                mask = players_df['Name'] == unsold['Name']
                if len(players_df.loc[mask]) > 0 and players_df.loc[mask, 'Status'].values[0] != 'Sold':
                    players_df.loc[mask, 'Status'] = 'Unsold'
            
            # Save to Excel
            players_df.to_excel(st.session_state.players_file_path, index=False)
            
        except Exception as e:
            st.error(f"Error updating Excel: {str(e)}")

def load_data_from_excel():
    """Load players and teams from Cpl_data.xlsx"""
    try:
        if not EXCEL_PATH.exists():
            st.error(f"Excel file not found at {EXCEL_PATH}")
            st.info(f"Looking for file at: {EXCEL_PATH.absolute()}")
            return None, None
        
        # Read all sheets
        xls = pd.ExcelFile(EXCEL_PATH)
        st.info(f"📊 Found {len(xls.sheet_names)} sheet(s): {xls.sheet_names}")
        
        # Load Players sheet
        if 'Players' in xls.sheet_names:
            players_df = pd.read_excel(EXCEL_PATH, sheet_name='Players')
            st.success(f"✅ Loaded Players sheet")
        else:
            # Try first sheet
            players_df = pd.read_excel(EXCEL_PATH, sheet_name=0)
            st.warning(f"⚠️ Using first sheet '{xls.sheet_names[0]}' for Players")
        
        # Sort players by category for CPL auction order
        players_df = sort_players_by_category(players_df)
        
        # Load Teams sheet
        if 'Teams' in xls.sheet_names:
            teams_df = pd.read_excel(EXCEL_PATH, sheet_name='Teams')
            st.success(f"✅ Loaded Teams sheet")
        elif len(xls.sheet_names) > 1:
            # Try second sheet if it exists
            teams_df = pd.read_excel(EXCEL_PATH, sheet_name=1)
            st.warning(f"⚠️ Using second sheet '{xls.sheet_names[1]}' for Teams")
        else:
            # Only one sheet - return error
            st.error("❌ Excel file must have at least 2 sheets (Players and Teams)")
            st.info("""
            **Required Excel Structure:**
            - Sheet 1: 'Players' with columns: PlayerID, Name, Role, BaseTokens, PhotoFileName
            - Sheet 2: 'Teams' with columns: TeamID, TeamName, LogoFile
            """)
            return None, None
        
        # Validate required columns
        required_player_cols = ['PlayerID', 'Name', 'Role', 'BaseTokens']
        required_team_cols = ['TeamID', 'TeamName', 'LogoFile']
        
        missing_player_cols = [col for col in required_player_cols if col not in players_df.columns]
        missing_team_cols = [col for col in required_team_cols if col not in teams_df.columns]
        
        if missing_player_cols:
            st.error(f"❌ Players sheet missing columns: {missing_player_cols}")
            st.info(f"Found columns: {list(players_df.columns)}")
            return None, None
        
        if missing_team_cols:
            st.error(f"❌ Teams sheet missing columns: {missing_team_cols}")
            st.info(f"Found columns: {list(teams_df.columns)}")
            return None, None
        
        return players_df, teams_df
        
    except Exception as e:
        st.error(f"Error loading Excel file: {str(e)}")
        st.info(f"Expected path: {EXCEL_PATH.absolute()}")
        import traceback
        st.code(traceback.format_exc())
        return None, None

# Custom CSS
st.markdown("""
<style>
    .team-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 15px;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 10px;
    }
    .player-card {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        padding: 20px;
        border-radius: 15px;
        color: white;
    }
    .unsold-badge {
        background-color: #ff6b6b;
        color: white;
        padding: 5px 15px;
        border-radius: 20px;
        display: inline-block;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar - Setup
with st.sidebar:
    st.title("⚙️ Auction Setup")
    
    # Show paths for debugging
    with st.expander("📁 File Paths"):
        st.code(f"Base Dir: {BASE_DIR.absolute()}")
        st.code(f"Assets Dir: {ASSETS_DIR.absolute()}")
        st.code(f"Images Dir: {IMAGES_DIR.absolute()}")
        st.code(f"Excel Path: {EXCEL_PATH.absolute()}")
        st.code(f"Excel Exists: {EXCEL_PATH.exists()}")
        st.code(f"Images Dir Exists: {IMAGES_DIR.exists()}")
    
    # 🔍 DEBUG BUTTON - NEW CODE
    if st.button("🔍 Debug Excel File"):
        st.subheader("Excel File Debug Info")
        
        try:
            # Check if file exists
            st.write(f"**File exists:** {EXCEL_PATH.exists()}")
            st.write(f"**File path:** {EXCEL_PATH.absolute()}")
            
            if EXCEL_PATH.exists():
                # Get file size
                file_size = EXCEL_PATH.stat().st_size
                st.write(f"**File size:** {file_size} bytes ({file_size/1024:.2f} KB)")
                
                # Try to read Excel file
                xls = pd.ExcelFile(EXCEL_PATH)
                st.write(f"**Number of sheets:** {len(xls.sheet_names)}")
                st.write(f"**Sheet names:** {xls.sheet_names}")
                
                # Show first few rows of each sheet
                for sheet_name in xls.sheet_names:
                    st.write(f"### Sheet: '{sheet_name}'")
                    df = pd.read_excel(EXCEL_PATH, sheet_name=sheet_name)
                    st.write(f"**Shape:** {df.shape}")
                    st.write(f"**Columns:** {list(df.columns)}")
                    st.dataframe(df.head(3))
            else:
                st.error("File not found!")
                
                # List files in assets directory
                if ASSETS_DIR.exists():
                    st.write("**Files in assets directory:**")
                    for file in ASSETS_DIR.iterdir():
                        st.write(f"- {file.name} ({file.stat().st_size} bytes)")
                else:
                    st.error(f"Assets directory doesn't exist: {ASSETS_DIR}")
                    
        except Exception as e:
            st.error(f"Debug error: {str(e)}")
            import traceback
            st.code(traceback.format_exc())
    
    if not st.session_state.auction_started:
        st.subheader("1. Configure Auction")
        st.session_state.max_tokens = st.number_input("Max Tokens per Team", 500, 5000, TOTAL_TEAM_BUDGET, 100)
        st.session_state.max_squad_size = st.number_input("Max Squad Size", 10, 25, 15, 1)
        
        st.subheader("2. Load Data")
        
        # Load from Cpl_data.xlsx
        if st.button("📂 Load CPL Data", type="primary"):
            players_df, teams_df = load_data_from_excel()
            
            if players_df is not None and teams_df is not None:
                st.session_state.players_df = players_df
                st.session_state.players_file_path = str(EXCEL_PATH)
                st.session_state.teams = initialize_teams_from_excel(
                    teams_df, 
                    st.session_state.max_tokens,
                    st.session_state.max_squad_size
                )
                st.success(f"✅ Loaded {len(players_df)} players & {len(teams_df)} teams")
            else:
                st.error("Failed to load data from Cpl_data.xlsx")
        
        # Show data preview if loaded
        if st.session_state.players_df is not None:
            with st.expander("👀 Preview Players"):
                st.dataframe(st.session_state.players_df.head())
            
            with st.expander("👀 Preview Teams"):
                teams_preview = pd.DataFrame([
                    {'Team': name, 'ID': data['id'], 'Logo': data['logo']} 
                    for name, data in st.session_state.teams.items()
                ])
                st.dataframe(teams_preview)
        
        st.divider()
        
        if st.button("🚀 Start Auction", type="primary", disabled=(st.session_state.players_df is None)):
            if st.session_state.players_df is not None and len(st.session_state.teams) > 0:
                st.session_state.auction_started = True
                st.rerun()
            else:
                st.error("Please load players and teams data first!")
    
    else:
        st.success("🎯 Auction in Progress")
        if st.button("🔄 Reset Auction"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()
        
        st.divider()
        st.metric("Players Sold", f"{len(st.session_state.auction_history)}/{len(st.session_state.players_df)}")
        st.metric("Players Unsold", len(st.session_state.unsold_players))
        st.metric("Remaining", len(st.session_state.players_df) - len(st.session_state.auction_history) - len(st.session_state.unsold_players))
        
        progress = (len(st.session_state.auction_history) + len(st.session_state.unsold_players)) / len(st.session_state.players_df)
        st.progress(progress)
        
        st.divider()
        
        # Category Overview
        st.subheader("📊 Category Overview")
        for role in ROLE_ORDER:
            role_players = st.session_state.players_df[st.session_state.players_df['Role'] == role]
            sold_in_role = len([h for h in st.session_state.auction_history if h['Role'] == role])
            unsold_in_role = len([u for u in st.session_state.unsold_players if u['Role'] == role])
            
            st.write(f"{ROLE_EMOJIS[role]} **{role}**: {sold_in_role + unsold_in_role}/{len(role_players)} processed")
            if len(role_players) > 0:
                role_progress = (sold_in_role + unsold_in_role) / len(role_players)
                st.progress(role_progress)

# Main content
# Display CPL Logo at the top throughout the app
cpl_logo = load_cpl_logo()
if cpl_logo:
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.image(cpl_logo, width=700)

if not st.session_state.auction_started:
    # Welcome text
    st.markdown("<h2 style='text-align: center;'>Welcome to the Digital Bidding</h2>", unsafe_allow_html=True)
    
    st.markdown("""
    ### Setup Instructions:

    **Setup Instructions:**
    1. Configure max tokens and squad size in the sidebar
    2. Click "Load CPL Data" to load data from `assets/Cpl_data.xlsx`
    3. Click "Start Auction" to begin

    **Features:**
    - 🪙 Token-based bidding system
    - 🖼️ Team logos and player photos
    - 📊 Live team dashboards
    - 🎯 Role-based squad management
    - 📈 Real-time auction history
    - 👁️ View and reassign unsold players
    - 💾 Auto-update Excel files
    """)
    
else:
    # Header with tabs
    tab1, tab2, tab3 = st.tabs(["🎯 Live Auction", "👁️ Unsold Players", "📜 Auction History"])
    
    with tab1:
        # Team Dashboards
        st.subheader("📊 Team Dashboards")
        
        num_cols = min(4, len(st.session_state.teams))
        rows_needed = (len(st.session_state.teams) + num_cols - 1) // num_cols
        
        for row in range(rows_needed):
            cols = st.columns(num_cols)
            for col_idx in range(num_cols):
                team_idx = row * num_cols + col_idx
                if team_idx < len(st.session_state.teams):
                    team_name = list(st.session_state.teams.keys())[team_idx]
                    team_data = st.session_state.teams[team_name]
                    
                    with cols[col_idx]:
                        # Load and display logo using filename from Excel
                        logo_img = load_team_logo(team_data['logo'])
                        
                        if logo_img:
                            st.image(logo_img, width=100)
                        
                        st.markdown(f"### {team_name}")
                        
                        st.metric("Tokens Left", f"🪙 {team_data['tokens_left']}", 
                                 delta=f"-{team_data['max_tokens'] - team_data['tokens_left']}")
                        st.metric("Squad", f"{len(team_data['squad'])}/{team_data['max_squad_size']}")
                        
                        # Role breakdown
                        breakdown = " ".join([
                            f"{ROLE_EMOJIS[role]}{count}" 
                            for role, count in team_data['role_count'].items() 
                            if count > 0
                        ])
                        if breakdown:
                            st.caption(f"**Squad:** {breakdown}")
                        else:
                            st.caption("No players yet")
                        
                        # Category budgets
                        if 'category_budgets' in team_data:
                            st.caption("**Category Budgets:**")
                            for role in ROLE_ORDER:
                                budget = team_data['category_budgets'][role]
                                st.caption(f"{ROLE_EMOJIS[role]} {budget['remaining']} tokens left")
        
        st.divider()
        
        # Current Auction Phase
        if st.session_state.current_player_idx < len(st.session_state.players_df):
            current_phase = get_current_auction_phase(st.session_state.players_df, st.session_state.current_player_idx)
            
            if current_phase:
                st.markdown(f"""
                <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px; color: white; text-align: center; margin-bottom: 20px;'>
                    <h2 style='margin: 0; font-size: 28px;'>{current_phase['emoji']} {current_phase['phase_name']}</h2>
                    <p style='margin: 10px 0; font-size: 16px;'>Phase {current_phase['phase']}/{current_phase['total_phases']} | Progress: {current_phase['category_progress']['current']}/{current_phase['category_progress']['total']} players ({current_phase['category_progress']['percentage']:.1f}%)</p>
                    <p style='margin: 5px 0; font-size: 14px; opacity: 0.9;'>Budget Range: {current_phase['budget']['min']}-{current_phase['budget']['max']} tokens | Players Needed: {current_phase['budget']['min_players']}-{current_phase['budget']['max_players']}</p>
                </div>
                """, unsafe_allow_html=True)
        
        # Current Player
        if st.session_state.current_player_idx < len(st.session_state.players_df):
            player = st.session_state.players_df.iloc[st.session_state.current_player_idx]
            
            col1, col2 = st.columns([2, 3])
            
            with col1:
                st.subheader("🎯 Current Player")
                
                # Display player photo if available
                player_img = load_player_photo(player.get('PhotoFileName'))
                if player_img:
                    st.image(player_img, width=200)
                
                # Player card
                st.markdown(f"""
                <div class='player-card'>
                    <h2 style='margin:0;'>{player['Name']}</h2>
                    <p style='font-size: 20px; margin: 10px 0;'>
                        {ROLE_EMOJIS.get(player['Role'], '⭐')} {player['Role']}
                    </p>
                    <p style='font-size: 24px; font-weight: bold; margin: 5px 0;'>
                        Base: {player['BaseTokens']} 🪙
                    </p>
                    <p style='font-size: 14px; opacity: 0.9;'>
                        Player ID: {player['PlayerID']}
                    </p>
                </div>
                """, unsafe_allow_html=True)
            
            with col2:
                st.subheader("💰 Place Bid")
                
                # Bid form
                selected_team = st.selectbox("Select Winning Team", 
                                            options=list(st.session_state.teams.keys()))
                
                bid_price = st.number_input("Final Bid Price (Tokens)", 
                                           min_value=int(player['BaseTokens']),
                                           value=int(player['BaseTokens']),
                                           step=5)
                
                # Show team affordability
                if selected_team:
                    team = st.session_state.teams[selected_team]
                    can_afford = can_afford_player(team, bid_price)
                    squad_full = is_squad_full(team)
                    can_afford_cat = can_afford_category(team, player['Role'], bid_price)
                    has_space = has_role_space(team, player['Role'])
                    
                    col_a, col_b = st.columns(2)
                    with col_a:
                        if can_afford:
                            st.success(f"✅ Can afford ({team['tokens_left']} tokens)")
                        else:
                            st.error(f"❌ Insufficient tokens ({team['tokens_left']} tokens)")
                    
                    with col_b:
                        if not squad_full:
                            st.success(f"✅ Squad space ({len(team['squad'])}/{team['max_squad_size']})")
                        else:
                            st.error(f"❌ Squad full ({len(team['squad'])}/{team['max_squad_size']})")
                    
                    # Category budget check
                    col_c, col_d = st.columns(2)
                    with col_c:
                        if can_afford_cat:
                            remaining = team['category_budgets'][player['Role']]['remaining']
                            st.success(f"✅ {player['Role']} budget ({remaining} tokens)")
                        else:
                            remaining = team['category_budgets'][player['Role']]['remaining']
                            st.error(f"❌ {player['Role']} budget ({remaining} tokens)")
                    
                    with col_d:
                        if has_space:
                            current = team['role_count'][player['Role']]
                            max_players = CPL_CATEGORY_BUDGETS[player['Role']]['max_players']
                            st.success(f"✅ {player['Role']} space ({current}/{max_players})")
                        else:
                            current = team['role_count'][player['Role']]
                            max_players = CPL_CATEGORY_BUDGETS[player['Role']]['max_players']
                            st.error(f"❌ {player['Role']} full ({current}/{max_players})")
                
                col_btn1, col_btn2 = st.columns([1, 1])
                
                with col_btn1:
                    if st.button("✅ Confirm Sale", type="primary", use_container_width=True):
                        success, message = add_player_to_team(selected_team, player, bid_price)
                        if success:
                            st.success(f"🎉 {player['Name']} sold to {selected_team} for {bid_price} tokens!")
                            st.session_state.current_player_idx += 1
                            st.rerun()
                        else:
                            st.error(message)
                
                with col_btn2:
                    if st.button("⏭️ Mark Unsold", use_container_width=True):
                        mark_player_unsold(player)
                        st.warning(f"{player['Name']} marked as UNSOLD")
                        st.session_state.current_player_idx += 1
                        st.rerun()
        
        else:
            st.success("🎊 Auction Complete!")
            st.balloons()
            
            st.subheader("🏆 Final Squads")
            for team_name, team_data in st.session_state.teams.items():
                with st.expander(f"{team_name} - {len(team_data['squad'])} players | {team_data['tokens_left']} tokens left"):
                    if team_data['squad']:
                        squad_df = pd.DataFrame(team_data['squad'])
                        st.dataframe(squad_df, use_container_width=True)
                    else:
                        st.info("No players purchased")
    
    with tab2:
        st.subheader("👁️ Unsold Players")
        
        if len(st.session_state.unsold_players) > 0:
            st.info(f"Total Unsold Players: {len(st.session_state.unsold_players)}")
            
            # Assign unsold players section
            if st.session_state.current_player_idx >= len(st.session_state.players_df):
                st.markdown("### 🔄 Assign Unsold Players to Teams")
                st.info("Auction is complete! You can now manually assign unsold players to teams.")
                
                col1, col2 = st.columns([2, 3])
                
                with col1:
                    selected_unsold = st.selectbox(
                        "Select Unsold Player",
                        options=range(len(st.session_state.unsold_players)),
                        format_func=lambda x: f"{st.session_state.unsold_players[x]['Name']} ({st.session_state.unsold_players[x]['Role']})"
                    )
                
                with col2:
                    assign_team = st.selectbox("Assign to Team", options=list(st.session_state.teams.keys()))
                    assign_price = st.number_input(
                        "Assignment Price (Tokens)",
                        min_value=0,
                        value=int(st.session_state.unsold_players[selected_unsold]['BaseTokens']),
                        step=5
                    )
                
                if st.button("✅ Assign Player to Team", type="primary"):
                    player_data = st.session_state.unsold_players[selected_unsold]
                    success, message = add_player_to_team(assign_team, player_data, assign_price)
                    
                    if success:
                        # Remove from unsold list
                        st.session_state.unsold_players.pop(selected_unsold)
                        st.success(f"🎉 {player_data['Name']} assigned to {assign_team} for {assign_price} tokens!")
                        st.rerun()
                    else:
                        st.error(message)
                
                st.divider()
            
            # Display unsold players in cards
            cols_per_row = 4
            for i in range(0, len(st.session_state.unsold_players), cols_per_row):
                cols = st.columns(cols_per_row)
                for j in range(cols_per_row):
                    idx = i + j
                    if idx < len(st.session_state.unsold_players):
                        player = st.session_state.unsold_players[idx]
                        with cols[j]:
                            # Display player photo if available
                            player_img = load_player_photo(player.get('PhotoFileName'))
                            if player_img:
                                st.image(player_img, width=150)
                            
                            st.markdown(f"""
                            <div style='background: #ff6b6b; padding: 15px; border-radius: 10px; color: white; text-align: center;'>
                                <h4 style='margin: 0;'>{player['Name']}</h4>
                                <p style='margin: 5px 0;'>{ROLE_EMOJIS.get(player['Role'], '⭐')} {player['Role']}</p>
                                <p style='font-weight: bold; margin: 5px 0;'>Base: {player['BaseTokens']} 🪙</p>
                            </div>
                            """, unsafe_allow_html=True)
            
            # Download unsold players
            if st.button("📥 Download Unsold Players List"):
                unsold_df = pd.DataFrame(st.session_state.unsold_players)
                csv = unsold_df.to_csv(index=False)
                st.download_button("Download CSV", csv, "unsold_players.csv", "text/csv")
        else:
            st.info("No unsold players yet")
    
    with tab3:
        st.subheader("📜 Auction History")
        
        if st.session_state.auction_history:
            history_df = pd.DataFrame(st.session_state.auction_history)
            st.dataframe(history_df, use_container_width=True)
            
            # Export option
            csv = history_df.to_csv(index=False)
            st.download_button("📥 Download Auction Results", csv, "auction_results.csv", "text/csv")
        else:
            st.info("No auction history yet")
