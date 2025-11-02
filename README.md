# CPL Digital Auction System - React Version

A modern React-based cricket player auction system converted from the original Streamlit application. Features a token-based bidding system with real-time team dashboards and comprehensive auction management.

## 🏏 Features

- **Token-Based Bidding**: Teams have limited tokens to spend on players
- **Real-Time Dashboards**: Live team statistics and squad composition
- **Player Management**: Sell players or mark them as unsold
- **Visual Interface**: Team logos, player photos, and modern UI
- **Data Export**: Download auction results and unsold player lists
- **Excel Integration**: Loads data from Excel and updates results

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Prepare your data**
   - Ensure `assets/Cpl_data.xlsx` exists with two sheets:
     - **Players sheet**: PlayerID, Name, Role, BaseTokens, PhotoFileName
     - **Teams sheet**: TeamID, TeamName, LogoFile
   - Add team logos and player photos to `assets/images/`

3. **Start the application**
   ```bash
   # Start the backend server
   npm run server

   # In another terminal, start the React app
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── AuctionSetup.js      # Initial setup and configuration
│   │   ├── LiveAuction.js       # Main auction interface
│   │   ├── TeamDashboard.js     # Team statistics display
│   │   ├── UnsoldPlayers.js     # Manage unsold players
│   │   └── AuctionHistory.js    # View auction results
│   ├── services/
│   │   └── auctionService.js    # API communication
│   ├── App.js                   # Main application component
│   └── index.js                 # Application entry point
├── server/
│   └── server.js                # Express.js backend server
├── assets/
│   ├── Cpl_data.xlsx           # Player and team data
│   └── images/                  # Team logos and player photos
└── public/
    └── index.html              # HTML template
```

## 🎯 How to Use

### 1. Setup Phase
- Configure max tokens per team (default: 1000)
- Set max squad size (default: 15 players)
- Load CPL data from Excel file
- Start the auction

### 2. Live Auction
- View current player with photo and details
- Select winning team and enter bid price
- System validates team affordability and squad space
- Confirm sale or mark player as unsold

### 3. Team Management
- Monitor team dashboards with real-time updates
- Track tokens spent and remaining squad slots
- View role-based squad composition

### 4. Post-Auction
- Assign unsold players to teams manually
- Export auction results as CSV
- View comprehensive auction history with filters

## 🔧 Configuration

### Excel File Format

**Players Sheet:**
| PlayerID | Name | Role | BaseTokens | PhotoFileName |
|----------|------|------|------------|---------------|
| P001 | John Doe | Batsman | 100 | john_doe.jpg |

**Teams Sheet:**
| TeamID | TeamName | LogoFile |
|--------|----------|----------|
| T001 | Mumbai Kings | mumbai.png |

### Environment Variables
- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)

## 🎨 UI Features

- **Responsive Design**: Works on desktop and mobile devices
- **Modern Styling**: Gradient backgrounds and glass effects
- **Interactive Elements**: Hover effects and smooth transitions
- **Real-time Updates**: Live statistics and progress tracking
- **Visual Feedback**: Color-coded status indicators

## 🔄 API Endpoints

- `GET /api/load-data` - Load players and teams from Excel
- `POST /api/sell-player` - Record player sale
- `POST /api/mark-unsold` - Mark player as unsold
- `GET /api/auction-history` - Get auction history
- `GET /api/health` - Server health check

## 🚀 Deployment

### Development
```bash
npm run server  # Start backend
npm start       # Start frontend
```

### Production Build
```bash
npm run build   # Build React app
npm run server  # Start backend server
```

## 🔍 Troubleshooting

### Common Issues

1. **Excel file not found**
   - Ensure `assets/Cpl_data.xlsx` exists
   - Check file permissions

2. **Images not loading**
   - Verify images are in `assets/images/` folder
   - Check filename matches in Excel data

3. **API connection issues**
   - Ensure backend server is running on port 3001
   - Check CORS configuration

### Debug Mode
- Check browser console for errors
- Monitor network tab for API calls
- Use server logs for backend debugging

## 📈 Improvements from Streamlit Version

- **Better Performance**: React's virtual DOM and component optimization
- **Enhanced UX**: Smoother interactions and better responsiveness
- **Modern UI**: Contemporary design with better visual hierarchy
- **Scalability**: Easier to extend and maintain
- **Mobile Support**: Better mobile experience
- **Real-time Updates**: More responsive state management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.