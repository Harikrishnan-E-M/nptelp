# NPTEL Statistics Management System

A full-stack application to manage NPTEL statistics with Sanity CMS integration, built with Node.js/Express (backend) and React (frontend).

## Project Structure

```
nptel/
├── backend/                 # Express.js backend
│   ├── package.json
│   ├── server.js           # Express server
│   ├── sanityClient.js     # Sanity client setup
│   ├── .env                # Environment variables
│   └── uploads/            # CSV uploads directory
├── frontend/               # React frontend
│   ├── package.json
│   ├── vite.config.js      # Vite configuration
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       └── components/
│           ├── YearsList.jsx
│           └── Statistics.jsx
├── sanity/                 # Sanity Studio configuration
│   ├── package.json
│   ├── sanity.config.js
│   ├── schemaTypes/
│   │   ├── index.js
│   │   ├── academicYear.js
│   │   └── nptelData.js
│   └── .gitignore
├── index.html              # Old HTML (deprecated)
├── statistics.html         # Old HTML (deprecated)
└── README.md
```

## Features

- **Academic Year Management**: Create, view, and delete academic years
- **CSV Upload**: Upload NPTEL CSV data for each academic year
- **Statistics Dashboard**: View statistics for each academic year
- **Filtering & Search**: Filter by batch, semester, and search by name/registration/course
- **Sanity CMS Integration**: All data is stored in Sanity CMS
- **Responsive Design**: Mobile-friendly interface using Bootstrap

## Prerequisites

- Node.js >= 18
- npm or yarn
- Sanity account with project ID: `1asbko6r`
- Sanity authentication token

## Installation

### 1. Backend Setup

```bash
cd backend
npm install
```

Create/Update `.env` file:
```env
SANITY_PROJECT_ID=1asbko6r
SANITY_DATASET=production
SANITY_API_VERSION=2024-01-30
SANITY_TOKEN=your_sanity_token_here
PORT=5000
```

To get your Sanity token:
1. Go to https://manage.sanity.io
2. Navigate to your project
3. Go to API → Tokens
4. Create a new token with read and write permissions
5. Copy the token and paste it in `.env`

### 2. Frontend Setup

```bash
cd frontend
npm install
```

The frontend is configured to proxy API requests to `http://localhost:5000` (see `vite.config.js`).

### 3. Sanity Studio Setup

```bash
cd sanity
npm install
npx sanity deploy
```

This will deploy your schema to Sanity.

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
# Server will run at http://localhost:5000
```

### Start Frontend Development Server

In a new terminal:
```bash
cd frontend
npm run dev
# Frontend will run at http://localhost:3000
```

### Start Sanity Studio

In another terminal:
```bash
cd sanity
npm run dev
# Sanity Studio will run at http://localhost:3333
```

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Sanity Studio**: http://localhost:3333

## API Endpoints

### Get All Academic Years
```
GET /api/years
```
Returns array of all academic years.

### Get Statistics for a Year
```
GET /api/statistics/:yearId
```
Returns statistics and data for a specific academic year.

### Upload CSV File
```
POST /api/upload/:yearId
Content-Type: multipart/form-data

Body: file (CSV file)
```
Uploads CSV data for an academic year.

### Create Academic Year
```
POST /api/years
Content-Type: application/json

{
  "yearLabel": "2023-24",
  "startYear": 2023,
  "endYear": 2024,
  "description": "Academic year 2023-2024"
}
```

### Delete Academic Year
```
DELETE /api/years/:yearId
```
Deletes the academic year and all associated data.

## CSV File Format

Expected CSV columns:
- `Batch` - Student batch
- `Reg No` or `RegNo` - Registration number
- `Name` - Student name
- `Sem` - Semester
- `Course Code` - NPTEL course code
- `Course Title` - Course name
- `Credit` - Course credits
- `Score` - Student score
- `Exam Month` - Month of exam
- `Exam Year` - Year of exam
- `Cert ID` - Certificate ID
- `Status` - Accepted/Rejected/Pending

Example CSV structure:
```
Batch,Reg No,Name,Sem,Course Code,Course Title,Credit,Score,Exam Month,Exam Year,Cert ID,Status
2020,20CSR002,John Doe,even,CSR-001,Advanced Programming,3,75,October,2021,CERT123,Accepted
```

## Using the Application

### 1. Add Academic Year
- Click "Add Academic Year" button
- Fill in Year Label (e.g., 2023-24), Start Year, End Year, and Description
- Click "Save"

### 2. Upload CSV Data
- Select an academic year
- Click "View Statistics"
- Use the upload area to select a CSV file
- Click "Upload CSV"
- Data will be processed and stored in Sanity

### 3. View Statistics
- Click "View Statistics" for any academic year
- See overview statistics (total students, passed, failed, average score)
- Use filters and search to explore the data

### 4. Manage Data in Sanity Studio
- Access Sanity Studio at http://localhost:3333
- Create, edit, or delete academic years and NPTEL data directly
- View all documents and their relationships

## Building for Production

### Frontend Build
```bash
cd frontend
npm run build
# Creates dist/ folder with optimized build
```

### Sanity Deployment
Your schema is already deployed to Sanity. To update:
```bash
cd sanity
npm run deploy
```

### Backend Deployment
The backend can be deployed to services like:
- Heroku
- Railway
- Render
- Vercel (serverless)
- AWS Lambda
- Azure Functions

Update environment variables in your deployment platform with the Sanity credentials.

## Troubleshooting

### API Connection Issues
- Ensure backend is running on port 5000
- Check CORS is enabled in Express (`cors()` middleware)
- Verify Sanity token is valid and has read/write permissions

### CSV Upload Issues
- Verify CSV headers match expected column names
- Ensure CSV file is not corrupted
- Check backend console for detailed error messages

### Sanity Authentication Issues
- Verify SANITY_PROJECT_ID is correct: `1asbko6r`
- Check SANITY_TOKEN is valid and not expired
- Regenerate token if needed from Sanity dashboard

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Set `port: 3001` in `vite.config.js`
- Sanity: Use `sanity dev --port 3334`

## Data Schema

### Academic Year Document
```javascript
{
  _id: "...",
  _type: "academicYear",
  yearLabel: "2023-24",
  startYear: 2023,
  endYear: 2024,
  description: "Academic year 2023-2024",
  dataCount: 150
}
```

### NPTEL Data Document
```javascript
{
  _id: "...",
  _type: "nptelData",
  year: { _type: "reference", _ref: "year-id" },
  batch: "2020",
  regNo: "20CSR002",
  name: "John Doe",
  semester: "even",
  courseCode: "CSR-001",
  courseTitle: "Advanced Programming",
  credit: "3",
  score: "75",
  examMonth: "October",
  examYear: "2021",
  certId: "CERT123",
  status: "Accepted"
}
```

## Next Steps

1. Get your Sanity token and add to `.env`
2. Install dependencies in backend, frontend, and sanity folders
3. Deploy schema to Sanity: `cd sanity && npx sanity deploy`
4. Start all services and access the application
5. Upload your CSV file to get started

## Support

For issues or questions:
- Check backend console for API errors
- Verify Sanity project and token
- Review CSV file format
- Check environment variables are set correctly

---

**Project ID**: 1asbko6r
**Frontend**: React + Vite + Bootstrap
**Backend**: Express.js + Node.js
**CMS**: Sanity
**Database**: Sanity dataset (production)
