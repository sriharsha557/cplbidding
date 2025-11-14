# Simple Supabase Setup for CPL Auction

## 🚀 Quick Setup (5 minutes)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login
3. Click "New Project"
4. Choose organization and name: `cpl-auction`
5. Generate password and select region
6. Wait for project to be ready

### 2. Create Database Tables
1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the entire content from `supabase-schema.sql`
3. Click **Run** to create all tables

### 3. Get Your Keys
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### 4. Add Environment Variables
Create `.env.local` file in your project root:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Install Dependencies & Start
```bash
npm install
npm start
```

## 🎯 How It Works

### **Excel Upload Flow:**
1. **Upload Excel** → ExcelUpload component reads file
2. **Parse Data** → Converts to JSON (players + teams)
3. **Insert to Supabase** → Direct database insert
4. **Load from Supabase** → App loads data from database

### **Auction Flow:**
1. **Load Data** → Supabase first, Excel fallback
2. **Sell Player** → Updates Supabase tables
3. **Real-time Updates** → All changes saved to database

## 📊 Database Tables

### **teams**
- `team_id`, `team_name`, `logo_file`
- `tokens_left`, `max_tokens`, `max_squad_size`
- Category budgets: `batsman_budget`, `bowler_budget`, etc.

### **players**
- `player_id`, `name`, `role`, `base_tokens`
- `photo_filename`, `department`
- `status` (Available/Sold/Unsold), `sold_to`, `sold_price`

### **auction_history** (optional)
- Tracks all sales for reporting

## 🔧 Features

✅ **Excel Upload** → Direct Supabase insert
✅ **Fallback Support** → Works with Excel if Supabase fails
✅ **Real-time Updates** → All auction data saved
✅ **Category Budgets** → CPL rules enforced
✅ **Simple Schema** → Mirrors your Excel structure

## 🚨 Troubleshooting

**"Missing Supabase environment variables"**
- Add `.env.local` file with your Supabase keys

**"Failed to upload"**
- Check Supabase project is running
- Verify API keys are correct
- Check browser console for errors

**"Excel fallback working"**
- Normal behavior if Supabase not configured
- App works with Excel files as backup

## 🎯 Next Steps

1. **Set up Supabase** (5 minutes)
2. **Upload your Excel** → Data goes to Supabase
3. **Run auction** → Everything saved to database
4. **Deploy** → Vercel + Supabase = Production ready!

Your Excel workflow stays the same, but now it's backed by a real database! 🏏✨