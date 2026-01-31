# NPTEL Statistics Management System

A modern web application to manage and visualize NPTEL statistics with Sanity CMS integration.

**Frontend**: React 18 + Vite + Bootstrap 5  
**Backend**: Sanity CMS (Headless)  
**Deployment**: Vercel (Frontend) + Sanity Cloud

## Quick Start

### 1. Install Dependencies

```bash
# Frontend
cd frontend && npm install

# Sanity Studio  
cd sanity && npm install
```

### 2. Run Development

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Sanity Studio (optional)
cd sanity && npm run dev
```

- Frontend: http://localhost:5173
- Sanity Studio: http://localhost:3333

### 3. Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Build command: `npm run build`
4. Root directory: `frontend`
5. Deploy!

## Features

- 📊 Interactive statistics dashboard
- 📅 Multi-year academic data management
- 📈 Batch-wise analytics and filtering
- 🎓 Student performance tracking
- 🔍 Advanced data filtering
- Direct Sanity integration (no backend API needed)

## Project Structure

```
nptel/
├── frontend/               # React app (Vite)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/           # Sanity client
│   │   ├── App.jsx        # Main app
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── sanity/                # Sanity Studio
│   ├── schemaTypes/       # Document schemas
│   ├── sanity.config.js
│   └── package.json
└── backend/               # [DEPRECATED - Can be removed]
```

## Architecture

Frontend fetches data **directly from Sanity** (no backend API needed):

```
Frontend (React) → Sanity Client → Sanity API
```

Benefits:
- No backend server maintenance
- Real-time data from Sanity
- Simplified deployment
- Better performance (direct client queries)

## Sanity Schema

### academicYear
- `yearLabel`: Year label (e.g., "2023-2024")
- `startYear`, `endYear`: Academic years
- `description`: Additional info
- `dataCount`: Number of records

### nptelData
- `year`: Reference to academicYear
- `batch`, `regNo`, `name`, `semester`
- `courseCode`, `courseTitle`, `credit`
- `score`, `examMonth`, `examYear`
- `certId`, `proofUrl`, `status`

## Environment Setup

The application is pre-configured with:
- Project ID: `1asbko6r`
- Dataset: `production`
- Credentials: In `frontend/src/lib/sanityClient.js`

No additional environment setup required for development!

## Deployment Checklist

- [x] Frontend dependencies installed
- [x] Sanity client configured
- [ ] Push to GitHub
- [ ] Connect Vercel to GitHub repository
- [ ] Deploy frontend to Vercel
- [ ] Verify Sanity data is accessible

## Troubleshooting

**Port already in use?**
```bash
# Frontend: Change port in vite.config.js
# or use:
npm run dev -- --port 5174

# Sanity: Use different port
npm run dev -- --port 3334
```

**Build errors?**
```bash
# Clear cache and reinstall
rm -r node_modules
npm install
npm run build -- --force
```

**Sanity connection issues?**
- Verify project ID: `1asbko6r`
- Check dataset: `production`
- Ensure API access is enabled in Sanity dashboard

## Next Steps

1. **Install dependencies**: `npm install` in frontend/ and sanity/
2. **Run frontend**: `npm run dev` in frontend/
3. **Manage data**: Open Sanity Studio (http://localhost:3333)
4. **Deploy**: Push to GitHub and connect Vercel

## Cleanup

The following files can be safely deleted (old documentation):
- `QUICKSTART.md`
- `DEPLOYMENT.md`
- `FILE_STRUCTURE.txt`
- `PROJECT_STRUCTURE.md`
- `START_HERE.txt`
- `setup.bat`
- `setup.sh`
- `index.html` (old)
- `statistics.html` (old)
- `backend/` (optional - no longer used)

---

**Status**: ✅ Ready for Production  
**Last Updated**: January 2026  
**Project ID**: 1asbko6r  
**Sanity Dashboard**: https://manage.sanity.io
