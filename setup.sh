#!/bin/bash
# Setup script for NPTEL Statistics Management System

echo "🚀 Setting up NPTEL Statistics Management System..."

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "✅ Backend setup complete!"
echo "Create .env file with your Sanity token:"
echo "  SANITY_PROJECT_ID=1asbko6r"
echo "  SANITY_DATASET=production"
echo "  SANITY_API_VERSION=2024-01-30"
echo "  SANITY_TOKEN=your_token_here"
echo "  PORT=5000"

# Frontend setup
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend setup complete!"

# Sanity setup
echo ""
echo "📦 Installing Sanity dependencies..."
cd ../sanity
npm install
echo "✅ Sanity setup complete!"

echo ""
echo "🎉 Setup complete! Now do the following:"
echo ""
echo "1. Get your Sanity token from: https://manage.sanity.io"
echo "2. Add it to backend/.env file"
echo "3. Deploy schema: cd sanity && npx sanity deploy"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo "6. Start Sanity Studio: cd sanity && npm run dev"
echo ""
echo "Then open:"
echo "  Frontend: http://localhost:3000"
echo "  Sanity Studio: http://localhost:3333"
