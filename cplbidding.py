import streamlit as st
import pandas as pd
from datetime import datetime
import io
from PIL import Image
import os

# Page config
st.set_page_config(page_title="IPL Company Auction", layout="wide", page_icon="🏏")

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

# Role emojis
ROLE_EMOJIS = {
    'Batsman': '🏏',
    'Bowler': '🎯',
    'WicketKeeper': '🧤',
    'All-rounder': '⚡'
}

def load_team_logo(logo_filename):
    """Load team logo from file"""
    try:
        if logo_filename and os.path.exists(logo_filename):
            img = Image.open(logo_filename)
            img = img.resize((200, 200))
            return img
        return None
    except:
        return None

def initialize_teams_from_excel(teams_df, max_tokens, max_squad_size):
    """Initialize teams from Excel file"""
    teams = {}
    for _, row in teams_df.iterrows():
        team_name = row['TeamName']
        teams[team_name] = {
            'id': row['TeamID'],
            'logo': row.get('LogoFile', None),
            'tokens_left': max_tokens,
            'squad': [],
            'max_tokens': max_tokens,
            'max_squad_size': max_squad_size,
            'role_count': {'Batsman': 0, 'Bowler': 0, 'WicketKeeper': 0, 'All-rounder': 0}
        }
    return teams

def can_afford_player(team, bid_price):
    """Check if team can afford the player"""
    return team['tokens_left'] >= bid_price

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
            
            # Add sold status columns
            players_df['Status'] = 'Unsold'
            players_df['SoldTo'] = ''
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
                if players_df.loc[mask, 'Status'].values[0] != 'Sold':
                    players_df.loc[mask, 'Status'] = 'Unsold'
            
            # Save to Excel
            players_df.to_excel(st.session_state.players_file_path, index=False)
            
        except Exception as e:
            st.error(f"Error updating Excel: {str(e)}")

def create_sample_data():
    """Create sample player and team data"""
    players_df = pd.DataFrame({
        'PlayerID': ['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008'],
        'Name': ['Rahul Sharma', 'Ankit Verma', 'Neha Reddy', 'Arjun Patel', 
                 'Priya Singh', 'Karan Mehta', 'Sneha Gupta', 'Vivek Kumar'],
        'Role': ['Batsman', 'Bowler', 'WicketKeeper', 'All-rounder', 
                 'Batsman', 'Bowler', 'All-rounder', 'Batsman'],
        'BaseTokens': [20, 15, 18, 25, 22, 16, 24, 19],
        'PhotoFileName': ['', '', '', '', '', '', '', '']
    })
    
    teams_df = pd.DataFrame({
        'TeamID': ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08'],
        'TeamName': ['Team Red', 'Team Blue', 'Team Green', 'Team Yellow',
                     'Team Orange', 'Team Purple', 'Team Pink', 'Team Cyan'],
        'LogoFile': ['', '', '', '', '', '', '', '']
    })
    
    return players_df, teams_df

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
    
    if not st.session_state.auction_started:
        st.subheader("1. Configure Auction")
        st.session_state.max_tokens = st.number_input("Max Tokens per Team", 500, 5000, 1000, 100)
        st.session_state.max_squad_size = st.number_input("Max Squad Size", 10, 25, 15, 1)
        
        st.subheader("2. Upload Data")
        use_sample = st.checkbox("Use Sample Data", value=True)
        
        if use_sample:
            players_df, teams_df = create_sample_data()
            st.session_state.players_df = players_df
            st.session_state.teams = initialize_teams_from_excel(teams_df, 
                                                                 st.session_state.max_tokens,
                                                                 st.session_state.max_squad_size)
            st.success(f"✅ Loaded {len(players_df)} players & {len(teams_df)} teams")
        else:
            players_file = st.file_uploader("Upload Players Excel", type=['xlsx'], key='players')
            teams_file = st.file_uploader("Upload Teams Excel", type=['xlsx'], key='teams')
            
            if players_file and teams_file:
                # Save uploaded files
                st.session_state.players_file_path = f"players_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
                with open(st.session_state.players_file_path, 'wb') as f:
                    f.write(players_file.getbuffer())
                
                st.session_state.teams_file_path = f"teams_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
                with open(st.session_state.teams_file_path, 'wb') as f:
                    f.write(teams_file.getbuffer())
                
                # Load data
                st.session_state.players_df = pd.read_excel(st.session_state.players_file_path)
                teams_df = pd.read_excel(st.session_state.teams_file_path)
                st.session_state.teams = initialize_teams_from_excel(teams_df,
                                                                     st.session_state.max_tokens,
                                                                     st.session_state.max_squad_size)
                
                st.success(f"✅ Loaded {len(st.session_state.players_df)} players & {len(teams_df)} teams")
        
        if st.button("🚀 Start Auction", type="primary"):
            if st.session_state.players_df is not None and len(st.session_state.teams) > 0:
                st.session_state.auction_started = True
                st.rerun()
            else:
                st.error("Please load players and teams data!")
    
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
        
        # View Unsold Players button
        if len(st.session_state.unsold_players) > 0:
            if st.button("👁️ View Unsold Players", use_container_width=True):
                st.session_state.show_unsold = True

# Main content
if not st.session_state.auction_started:
    st.title("🏏 IPL-Style Company Auction")
    st.markdown("""
    ### Welcome to the Auction Platform!
    
    **Setup Instructions:**
    1. Configure max tokens and squad size
    2. Upload Excel files:
       - **Players.xlsx**: PlayerID, Name, Role, BaseTokens, PhotoFileName
       - **Teams.xlsx**: TeamID, TeamName, LogoFile
    3. Click "Start Auction" to begin
    
    **Features:**
    - 🪙 Token-based bidding system
    - 🖼️ Team logos (200x200px)
    - 📊 Live team dashboards
    - 🎯 Role-based squad management
    - 📈 Real-time auction history
    - 👁️ View unsold players
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
                        # Load and display logo
                        logo_img = load_team_logo(team_data['logo']) if team_data['logo'] else None
                        
                        if logo_img:
                            st.image(logo_img, width=100)
                        
                        st.markdown(f"### {team_name}")
                        
                        tokens_pct = (team_data['tokens_left'] / team_data['max_tokens']) * 100
                        
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
        
        st.divider()
        
        # Current Player
        if st.session_state.current_player_idx < len(st.session_state.players_df):
            player = st.session_state.players_df.iloc[st.session_state.current_player_idx]
            
            col1, col2 = st.columns([2, 3])
            
            with col1:
                st.subheader("🎯 Current Player")
                
                # Display player photo if available
                if player.get('PhotoFileName') and os.path.exists(player['PhotoFileName']):
                    try:
                        player_img = Image.open(player['PhotoFileName'])
                        st.image(player_img, width=200)
                    except:
                        pass
                
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
