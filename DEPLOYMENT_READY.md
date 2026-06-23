# 🚀 Deployment Checklist

## ✅ Code Changes Complete

### Frontend Enhancements
- ✅ Created Sanity client (`src/lib/sanityClient.js`)
- ✅ Updated YearsList to query Sanity directly
- ✅ Updated Statistics component to query Sanity directly
- ✅ Removed axios dependency (replaced with @sanity/client)
- ✅ Removed backend proxy from vite.config.js
- ✅ Removed port 3000 configuration (now uses 5173)
- ✅ Added App.css import to main.jsx

### Code Cleanup
- ✅ Removed old documentation files (QUICKSTART.md, DEPLOYMENT.md, etc.)
- ✅ Removed old HTML files (index.html, statistics.html)
- ✅ Removed setup scripts (setup.bat, setup.sh)
- ✅ Created fresh README.md with deployment instructions
- ✅ Created .env.example for reference
- ✅ Verified .gitignore includes all necessary excludes

### Project Structure (Clean)
```
nptel/
├── frontend/          # React + Vite + Bootstrap
├── sanity/            # Sanity Studio
├── backend/           # [OPTIONAL] Can be deleted
└── README.md          # Complete deployment guide
```

## 📋 Next Steps for Deployment

### 1. Install Dependencies
```bash
cd frontend && npm install
cd ../sanity && npm install
```

### 2. Test Locally
```bash
# Terminal 1: Frontend
cd frontend && npm run dev
# Visit http://localhost:5173

# Terminal 2: Sanity Studio (optional)
cd sanity && npm run dev
# Visit http://localhost:3333
```

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm install -g vercel
vercel
```

#### Option B: Using Vercel Dashboard
1. Push to GitHub
2. Go to https://vercel.com
3. Click "Add New Project"
4. Select your GitHub repository
5. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Deploy!

### 4. Verify Deployment
- Check Vercel dashboard for build status
- Test app at your Vercel URL
- Verify Sanity data loads correctly

## 🔧 Configuration Reference

### Sanity (Pre-configured)
- **Project ID**: `1asbko6r`
- **Dataset**: `production`
- **API Version**: `2024-01-30`
- **Location**: `frontend/src/lib/sanityClient.js`

### Frontend Environment
- **Port**: 5173 (development)
- **Framework**: React 18 + Vite
- **Build**: `npm run build`
- **Output**: `dist/`

## ⚠️ Important Notes

1. **Backend is no longer needed** - Frontend queries Sanity directly
2. **No proxy configuration** - All API calls go directly to Sanity
3. **Credentials are public** - Project ID is safe to expose (no sensitive token in frontend)
4. **backend/ folder** can be safely deleted if desired (no longer used)

## 📊 Performance Improvements

- ✅ Removed backend server dependency
- ✅ Direct Sanity queries (lower latency)
- ✅ Smaller bundle size (removed axios)
- ✅ Simplified deployment pipeline
- ✅ Real-time data from Sanity

## 🎯 Git Commands

```bash
# Stage all changes
git add .

# Commit
git commit -m "Refactor: Deploy to Sanity directly, remove backend dependency"

# Push to GitHub
git push origin main
```

## 📞 Troubleshooting

**Q: Getting Sanity connection errors?**
A: Verify Project ID (1asbko6r) and dataset (production) in sanityClient.js

**Q: Port 5173 already in use?**
A: Change in vite.config.js: `port: 5174`

**Q: Build failing?**
A: Clear node_modules and reinstall: `rm -r node_modules && npm install`

**Q: Data not showing?**
A: Ensure academic years and nptelData exist in Sanity Studio

---

**Status**: ✅ Ready for Production  
**Last Updated**: January 31, 2026
