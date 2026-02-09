#!/bin/bash

# NPTEL Vercel Deployment Script
echo "🚀 Building NPTEL project for Vercel..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install sanity dependencies
echo "📦 Installing sanity dependencies..."
cd sanity
npm install
cd ..

# Build everything
echo "🏗️  Building all projects..."
npm run build:all

echo "✅ Build complete! Ready to deploy to Vercel"
echo ""
echo "Next steps:"
echo "1. Run: vercel"
echo "2. After deployment, add your Vercel URL to Sanity CORS:"
echo "   cd sanity && npx sanity cors add https://your-app.vercel.app --credentials"
