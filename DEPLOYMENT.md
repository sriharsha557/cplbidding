# CPL Auction Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

**Pros:**
- ✅ Easy deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Free tier available

**Cons:**
- ❌ File uploads are temporary (Excel files reset on restart)
- ❌ 10-second function timeout on free tier

### Option 2: Railway

**Pros:**
- ✅ Persistent file storage
- ✅ Full server environment
- ✅ Database support
- ✅ Easy GitHub integration

**Cons:**
- ❌ Paid service ($5/month minimum)

### Option 3: Render

**Pros:**
- ✅ Free tier available
- ✅ Persistent storage
- ✅ Full server environment

**Cons:**
- ❌ Slower cold starts on free tier

## 📋 Vercel Deployment Steps

### 1. Prepare Your Repository

```bash
# Make sure all files are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: cpl-auction
# - Directory: ./
# - Override settings? No
```

**Option B: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Create React App
   - Build Command: `npm run vercel-build`
   - Output Directory: `build`
6. Click "Deploy"

### 3. Environment Variables (if needed)

In Vercel Dashboard:
1. Go to Project Settings
2. Environment Variables
3. Add any required variables

### 4. Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records

## 📋 Railway Deployment Steps

### 1. Prepare for Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### 2. Configure Railway

1. Set build command: `npm run build`
2. Set start command: `npm run server`
3. Add environment variables if needed

## 📋 Alternative: Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "server"]
```

Deploy to any Docker-compatible platform (DigitalOcean, AWS, etc.)

## ⚠️ Important Considerations

### File Storage Issue

**Problem:** Excel files are temporary on serverless platforms like Vercel.

**Solutions:**

1. **Use Database Storage** (Recommended for production)
   - Store auction data in PostgreSQL/MongoDB
   - Generate Excel files on-demand

2. **Use Cloud Storage**
   - AWS S3, Google Cloud Storage
   - Upload/download Excel files

3. **Accept Temporary Storage**
   - Good for demo/testing
   - Data resets on deployment

### Performance Optimization

1. **Enable Compression**
```javascript
// In server.js
const compression = require('compression');
app.use(compression());
```

2. **Add Caching Headers**
```javascript
// For static assets
app.use('/assets', express.static('assets', {
  maxAge: '1d'
}));
```

## 🔧 Production Checklist

- [ ] Remove debug console.logs
- [ ] Add error boundaries in React
- [ ] Set up proper error logging
- [ ] Configure CORS for production domain
- [ ] Add rate limiting
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Test with production data
- [ ] Set up backup strategy for Excel files

## 🌐 Recommended Production Setup

For a production CPL auction:

1. **Frontend:** Vercel/Netlify
2. **Backend:** Railway/Render with PostgreSQL
3. **File Storage:** AWS S3 or Google Cloud Storage
4. **Monitoring:** Sentry for error tracking
5. **Analytics:** Google Analytics or Mixpanel

## 📞 Quick Start Commands

```bash
# Local development
npm install
npm run server  # Terminal 1
npm start       # Terminal 2

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## 🆘 Troubleshooting

**Build Fails:**
- Check Node.js version (>=18)
- Clear node_modules and reinstall
- Check for missing dependencies

**API Not Working:**
- Verify API routes in vercel.json
- Check CORS configuration
- Verify environment variables

**Excel Files Not Persisting:**
- Expected on Vercel (serverless)
- Consider database storage for production