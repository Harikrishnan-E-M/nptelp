# Quick Deployment Commands

## Deploy to Vercel (Windows PowerShell)

### Quick Deploy
```powershell
# Build and prepare for deployment
.\deploy.ps1

# Deploy to Vercel
vercel
```

### After First Deployment
```powershell
# Add your Vercel URL to Sanity CORS (replace with your actual URL)
cd sanity
npx sanity cors add https://your-project.vercel.app --credentials
cd ..
```

## Access Your Deployed App

- **Main App**: `https://your-project.vercel.app/`
- **Sanity Studio**: `https://your-project.vercel.app/sanity`

## Local Development

```powershell
# Frontend only
cd frontend
npm run dev

# Sanity Studio only
cd sanity
npm run dev
```

## If Vercel CLI is not installed
```powershell
npm install -g vercel
```

## Redeploy After Changes
```powershell
# Option 1: Build locally first (recommended)
.\deploy.ps1
vercel --prod

# Option 2: Let Vercel build
vercel --prod
```
