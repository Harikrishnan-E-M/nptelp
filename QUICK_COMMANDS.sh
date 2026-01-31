#!/bin/bash
# Quick Commands Reference

# 🏃 QUICK START
# ============================================================

# 1. Install All Dependencies
npm install --prefix frontend
npm install --prefix sanity

# 2. Run Frontend Development
npm run dev --prefix frontend

# 3. Run Sanity Studio (optional)
npm run dev --prefix sanity

# 4. Build for Production
npm run build --prefix frontend

# 📤 DEPLOYMENT
# ============================================================

# Push to GitHub
git add .
git commit -m "Refactor: Deploy frontend to Sanity (direct integration)"
git push origin main

# Deploy to Vercel (via CLI)
npm install -g vercel
cd frontend
vercel

# Deploy to Vercel (via Dashboard)
# 1. Go to https://vercel.com
# 2. Import project from GitHub
# 3. Set root directory: frontend
# 4. Deploy!

# 🧹 CLEANUP
# ============================================================

# Remove backend folder (if not needed)
rm -r backend

# Clear npm cache
npm cache clean --force

# Clear node_modules and reinstall (if issues)
rm -r frontend/node_modules
npm install --prefix frontend

# 🔍 DEBUGGING
# ============================================================

# Check frontend build
npm run build --prefix frontend

# Test frontend locally
npm run dev --prefix frontend

# View Sanity data
# Open: http://localhost:3333 (Sanity Studio)
# Project ID: 1asbko6r

# Check Sanity connectivity
# Edit: frontend/src/lib/sanityClient.js
# Verify: projectId and dataset

# 📊 PROJECT INFO
# ============================================================

# Project ID: 1asbko6r
# Dataset: production
# Frontend Port: 5173
# Sanity Studio Port: 3333

# 📝 USEFUL LINKS
# ============================================================

# Sanity Dashboard: https://manage.sanity.io
# Vercel Dashboard: https://vercel.com/dashboard
# Sanity Docs: https://www.sanity.io/docs
# Vite Docs: https://vitejs.dev

# 🐛 COMMON ISSUES
# ============================================================

# Port already in use?
# Change in frontend/vite.config.js: port: 5174

# Sanity not loading?
# Check projectId and dataset in frontend/src/lib/sanityClient.js

# Build failed?
# rm -r node_modules && npm install

# Data not showing?
# Verify academic years exist in Sanity Studio
# Check browser console for errors
