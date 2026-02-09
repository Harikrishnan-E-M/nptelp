# Vercel Deployment Guide

## Project Structure
Your project is now configured as a monorepo where both the frontend and Sanity Studio are deployed together.

## How It Works
- Main app: `your-domain.vercel.app/`
- Sanity Studio: `your-domain.vercel.app/sanity`

## Deployment Steps

### 1. First Time Setup (Local Test)
```bash
# Install all dependencies
npm install

# Build everything
npm run build:all
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy
vercel
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Import your repository
3. Vercel will automatically detect the configuration
4. Click "Deploy"

### 3. Configure CORS in Sanity (IMPORTANT!)

After your first deployment, you'll get a Vercel URL (e.g., `https://your-app.vercel.app`).

You need to add this URL to Sanity's CORS settings:

```bash
cd sanity
npx sanity cors add https://your-app.vercel.app --credentials
```

If you have a custom domain:
```bash
npx sanity cors add https://your-domain.com --credentials
```

### 4. Environment Variables (if needed)

If your frontend needs environment variables, add them in Vercel:
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add any required variables (VITE_SANITY_PROJECT_ID, etc.)

## Local Development

### Run Frontend Only
```bash
npm run dev:frontend
# Opens at http://localhost:5173
```

### Run Sanity Studio Only
```bash
npm run dev:sanity
# Opens at http://localhost:3333
```

### Run Both (in separate terminals)
```bash
# Terminal 1
npm run dev:frontend

# Terminal 2
npm run dev:sanity
```

## Troubleshooting

### Sanity Studio not loading
- Check CORS settings: `cd sanity && npx sanity cors list`
- Ensure your Vercel URL is added
- Check browser console for errors

### Build fails
- Ensure all dependencies are installed: `npm install && cd frontend && npm install && cd ../sanity && npm install`
- Check that both builds work individually:
  - `cd frontend && npm run build`
  - `cd sanity && npm run build`

### 404 on /sanity route
- Check that `vercel.json` is in the root directory
- Verify the rewrite rule is correct
- Redeploy the application

## File Changes Made

1. **sanity/sanity.config.js** - Added `basePath: '/sanity'`
2. **vercel.json** - Vercel deployment configuration
3. **package.json** - Root build orchestration
4. **scripts/copy-sanity.js** - Script to copy Sanity build to frontend

## What Happens During Build

1. Frontend builds to `frontend/dist/`
2. Sanity Studio builds to `sanity/dist/`
3. Sanity dist is copied to `frontend/dist/sanity/`
4. Vercel serves everything from `frontend/dist/`
5. Rewrites ensure `/sanity/*` routes to the Studio
