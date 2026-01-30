# Quick Start Guide

## Step 1: Get Sanity Token

1. Visit https://manage.sanity.io
2. Select your project (Project ID: `1asbko6r`)
3. Go to **API** → **Tokens**
4. Click **Add API Token**
5. Name it "NPTEL Backend"
6. Select these permissions:
   - `sanity.manage`
   - `sanity.content.read`
   - `sanity.content.write`
7. Click **Create**
8. Copy the token

## Step 2: Setup Environments

### Backend
```bash
cd backend
# Copy .env.example to .env
cp .env.example .env
```

Edit `backend/.env` and replace `your_token_here` with your actual Sanity token:
```
SANITY_TOKEN=sk_...your_token...
```

### Frontend
No additional setup needed! It will automatically proxy to backend on port 5000.

### Sanity Studio
No setup needed! Uses credentials from `sanity.config.js`

## Step 3: Install Dependencies

### Option A: Automatic Setup (Recommended for Windows)
```bash
# In the nptel directory
setup.bat
```

### Option B: Manual Setup
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install

# Sanity
cd sanity
npm install
```

## Step 4: Deploy Schema to Sanity

```bash
cd sanity
npx sanity deploy
```

This deploys your document types (`academicYear` and `nptelData`) to Sanity.

## Step 5: Start All Services

Open 3 terminal windows:

### Terminal 1: Backend (Port 5000)
```bash
cd backend
npm run dev
```
You should see: `Server running at http://localhost:5000`

### Terminal 2: Frontend (Port 3000)
```bash
cd frontend
npm run dev
```
You should see: `Local: http://localhost:3000`

### Terminal 3: Sanity Studio (Port 3333)
```bash
cd sanity
npm run dev
```
You should see: `http://localhost:3333`

## Step 6: Access the Application

- **Main App**: http://localhost:3000
- **Sanity Studio**: http://localhost:3333

## Step 7: Add Your First Academic Year

1. Go to http://localhost:3000
2. Click "Add Academic Year"
3. Fill in:
   - Year Label: `2023-24`
   - Start Year: `2023`
   - End Year: `2024`
   - Description: `Academic Year 2023-2024`
4. Click "Save"

## Step 8: Upload CSV File

1. Click "View Statistics" on your newly created year
2. Drag and drop or click to select your CSV file
3. Click "Upload CSV"
4. Wait for upload to complete (success message will appear)
5. Data will populate the table below

### CSV Requirements

Your CSV should have these columns:
- `Batch` - Student batch (e.g., 2020, 2021)
- `Reg No` - Student registration number
- `Name` - Student name
- `Sem` - Semester (even, odd)
- `Course Code` - NPTEL course code
- `Course Title` - Full course name
- `Credit` - Number of credits
- `Score` - Student's score
- `Exam Month` - Month of exam
- `Exam Year` - Year of exam
- `Cert ID` - Certificate ID
- `Status` - Accepted, Rejected, or Pending

Example CSV (save as `.csv` file):
```csv
Batch,Reg No,Name,Sem,Course Code,Course Title,Credit,Score,Exam Month,Exam Year,Cert ID,Status
2020,20CSR002,John Doe,even,CSR-001,Advanced Programming,3,75,October,2021,CERT123,Accepted
2020,20CSR003,Jane Smith,even,CSR-002,Data Science,3,82,October,2021,CERT124,Accepted
2021,21CSR001,Bob Johnson,odd,CSR-001,Advanced Programming,3,65,May,2022,CERT125,Rejected
```

## Step 9: View Statistics

- Filter by Batch
- Filter by Semester
- Search by Name, Registration Number, or Course Code
- View overall statistics (Total Students, Passed, Failed, Average Score)

## Common Issues

### "Connection refused" on localhost:5000
- Make sure backend is running: `cd backend && npm run dev`
- Check that port 5000 is not in use

### "Failed to load academic years"
- Check backend console for errors
- Verify Sanity token is correct in `backend/.env`
- Ensure schema is deployed: `cd sanity && npx sanity deploy`

### CSV Upload Fails
- Check CSV file format and column names
- Ensure CSV file is properly formatted (UTF-8 encoding)
- Check browser console for error details
- Check backend console for detailed error messages

### "Cannot find sanity/vision"
- Run `npm install` in sanity directory
- Run `cd sanity && npm install @sanity/vision`

## Next Steps

1. Customize the styling in `frontend/src/App.css`
2. Add more document types in `sanity/schemaTypes/`
3. Deploy to production
4. Add more academic years and CSV files

## Deployment

### Frontend Deployment (Vercel)
```bash
cd frontend
npm run build
# Deploy the dist/ folder to Vercel
```

### Backend Deployment (Render or Railway)
```bash
cd backend
npm run build
# Deploy to your chosen platform
```

### Sanity Studio
Already deployed! Update with:
```bash
cd sanity
npx sanity deploy
```

---

Need help? Check the main README.md for more details!
