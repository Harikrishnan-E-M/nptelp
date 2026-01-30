# NPTEL Statistics Management System - Complete Project Setup ✅

## 📁 Complete Project Structure

```
d:\nptel/
├── 📄 README.md                          # Main documentation
├── 📄 QUICKSTART.md                      # Quick start guide
├── 📄 DEPLOYMENT.md                      # Deployment instructions
├── 📄 .gitignore                         # Git ignore rules
├── 📄 setup.bat                          # Windows setup script
├── 📄 setup.sh                           # Linux/Mac setup script
├── 📄 index.html                         # Old HTML (deprecated)
├── 📄 statistics.html                    # Old HTML (deprecated)
│
├── 📂 backend/                           # Express.js Server
│   ├── 📄 package.json                   # Dependencies
│   ├── 📄 server.js                      # Express server with API routes
│   ├── 📄 sanityClient.js                # Sanity client configuration
│   ├── 📄 .env                           # Environment variables (SECRET - don't commit)
│   ├── 📄 .env.example                   # Example environment file
│   └── 📂 uploads/                       # CSV uploads directory
│
├── 📂 frontend/                          # React + Vite Frontend
│   ├── 📄 package.json                   # Dependencies
│   ├── 📄 vite.config.js                 # Vite configuration
│   ├── 📄 index.html                     # HTML entry point
│   └── 📂 src/
│       ├── 📄 main.jsx                   # React entry point
│       ├── 📄 App.jsx                    # Main React component
│       ├── 📄 App.css                    # Global styles
│       └── 📂 components/
│           ├── 📄 YearsList.jsx          # Academic years listing
│           └── 📄 Statistics.jsx         # Statistics & CSV upload
│
└── 📂 sanity/                            # Sanity Studio Configuration
    ├── 📄 package.json                   # Sanity dependencies
    ├── 📄 sanity.config.js               # Sanity configuration
    ├── 📄 .gitignore                     # Sanity-specific ignores
    ├── 📂 .sanity/
    │   └── 📄 projectDetails.json        # Project configuration
    └── 📂 schemaTypes/
        ├── 📄 index.js                   # Schema exports
        ├── 📄 academicYear.js            # Academic Year document type
        └── 📄 nptelData.js               # NPTEL Data document type
```

## 🎯 What's Included

### Backend (Express.js + Node.js)
- ✅ RESTful API with CORS support
- ✅ Sanity CMS integration
- ✅ CSV file upload and parsing
- ✅ Data statistics calculation
- ✅ Academic year CRUD operations
- ✅ Error handling and validation

### Frontend (React + Vite)
- ✅ Academic years listing page
- ✅ Statistics dashboard with filters
- ✅ CSV file upload interface
- ✅ Search and filter functionality
- ✅ Responsive design (Bootstrap)
- ✅ Real-time data updates

### Sanity CMS
- ✅ Academic Year document type
- ✅ NPTEL Data document type
- ✅ Proper schema validation
- ✅ Reference relationships
- ✅ Ready-to-use Sanity Studio

## 🚀 Quick Start Steps

### 1️⃣ Get Sanity Token
```bash
# Visit: https://manage.sanity.io
# Project ID: 1asbko6r
# Create API token with read+write permissions
```

### 2️⃣ Setup Backend
```bash
cd backend
# Copy .env.example to .env
# Add your Sanity token to .env
npm install
```

### 3️⃣ Setup Frontend
```bash
cd frontend
npm install
```

### 4️⃣ Setup Sanity
```bash
cd sanity
npm install
npx sanity deploy  # Deploy schema to Sanity
```

### 5️⃣ Start Services (3 terminals)

**Terminal 1 - Backend (Port 5000)**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend (Port 3000)**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - Sanity Studio (Port 3333)**:
```bash
cd sanity
npm run dev
```

### 6️⃣ Access Application
- Frontend: http://localhost:3000
- Sanity Studio: http://localhost:3333

## 📊 Database Schema

### academicYear Collection
```javascript
{
  _id: string,
  _type: "academicYear",
  yearLabel: string,        // e.g., "2023-24"
  startYear: number,        // e.g., 2023
  endYear: number,          // e.g., 2024
  description: string,      // Optional
  dataCount: number,        // Auto-updated record count
  _createdAt: datetime
}
```

### nptelData Collection
```javascript
{
  _id: string,
  _type: "nptelData",
  year: reference,          // Reference to academicYear
  batch: string,            // e.g., "2020"
  regNo: string,            // Registration number
  name: string,             // Student name
  semester: string,         // even/odd
  courseCode: string,       // NPTEL course code
  courseTitle: string,      // Course name
  credit: string,           // Credit value
  score: string,            // Student score
  examMonth: string,        // Exam month
  examYear: string,         // Exam year
  certId: string,           // Certificate ID
  status: string            // Accepted/Rejected/Pending
}
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/years` | Get all academic years |
| POST | `/api/years` | Create new academic year |
| DELETE | `/api/years/:yearId` | Delete academic year |
| GET | `/api/statistics/:yearId` | Get stats for specific year |
| POST | `/api/upload/:yearId` | Upload CSV for a year |
| GET | `/health` | Health check |

## 📝 CSV File Format

Required columns (case-sensitive):
- Batch
- Reg No (or RegNo)
- Name
- Sem
- Course Code
- Course Title
- Credit
- Score
- Exam Month
- Exam Year
- Cert ID
- Status

## 🎨 Frontend Features

### Years List Page
- Display all academic years
- Create new academic year
- Delete academic year
- Quick access to statistics

### Statistics Page
- Overview statistics (total, passed, failed, avg score)
- CSV upload interface
- Data table with sorting
- Filter by batch
- Filter by semester
- Search by name/reg no/course
- Reset filters
- Back navigation

## ⚙️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, Vite, Bootstrap 5, Axios |
| Backend | Node.js, Express.js, Multer, csv-parser |
| CMS | Sanity, GROQ queries |
| Styling | Bootstrap, Custom CSS |
| Package Manager | npm/yarn |

## 📚 Documentation Files

- **README.md** - Complete documentation with setup, API details, troubleshooting
- **QUICKSTART.md** - Step-by-step guide for first-time users
- **DEPLOYMENT.md** - Deployment guides for various platforms
- **PROJECT_STRUCTURE.md** - This file, explaining the complete setup

## 🛠️ Development

### Backend Development
- API routes in `backend/server.js`
- Sanity client in `backend/sanityClient.js`
- Environment variables in `backend/.env`

### Frontend Development
- Main app in `frontend/src/App.jsx`
- Components in `frontend/src/components/`
- Styling in `frontend/src/App.css`
- Vite config in `frontend/vite.config.js`

### Schema Development
- Academic Year schema: `sanity/schemaTypes/academicYear.js`
- NPTEL Data schema: `sanity/schemaTypes/nptelData.js`
- Export in `sanity/schemaTypes/index.js`

## 🚢 Deployment Options

1. **Vercel (Frontend) + Render (Backend)** - Easiest ⭐
2. **Railway.app** - Single platform ⭐⭐
3. **Docker Compose** - Self-hosted
4. **AWS** - Enterprise scale
5. **Heroku** - Simple deployment

See DEPLOYMENT.md for detailed instructions.

## 🔐 Security

- Environment variables for sensitive data
- API token in .env (not committed to git)
- CORS configured for specific origins
- Input validation on backend
- Sanity role-based access control

## 📦 Dependencies

### Backend
- express@4.18.2
- cors@2.8.5
- multer@1.4.5
- csv-parser@3.0.0
- @sanity/client@6.12.0
- dotenv@16.3.1

### Frontend
- react@18.2.0
- react-dom@18.2.0
- axios@1.6.2
- vite@5.0.8
- @vitejs/plugin-react@4.2.1
- bootstrap@5.3.3

### Sanity
- sanity@3.20.0
- @sanity/vision@3.20.0

## ✅ Checklist

- [x] Backend Express server with API routes
- [x] Frontend React components with Vite
- [x] Sanity schema and configuration
- [x] CSV upload functionality
- [x] Statistics calculation
- [x] Search and filter
- [x] CORS configuration
- [x] Error handling
- [x] Documentation
- [x] Setup scripts
- [x] Environment configuration
- [x] Responsive design

## 🆘 Troubleshooting

### Backend won't connect
1. Check `backend/.env` has valid SANITY_TOKEN
2. Verify port 5000 is not in use
3. Check backend console for errors

### Frontend API errors
1. Ensure backend is running
2. Check browser network tab for failed requests
3. Verify CORS is configured correctly

### CSV upload fails
1. Check CSV file format and headers
2. Verify file encoding (UTF-8)
3. Check backend logs for details

### Sanity schema not deployed
1. Ensure you're in `sanity/` directory
2. Run: `npx sanity deploy`
3. Verify project ID: 1asbko6r

## 📞 Support

- Check README.md for comprehensive guide
- Check QUICKSTART.md for setup steps
- Check DEPLOYMENT.md for production setup
- Review backend console logs
- Review browser developer console

## 🎓 Next Steps

1. ✅ Setup complete!
2. 📤 Add academic year
3. 📁 Upload CSV file
4. 📊 View statistics
5. 🌐 Deploy to production
6. 📈 Scale and optimize

---

**Project ID**: 1asbko6r  
**Created**: January 30, 2026  
**Version**: 1.0.0  
**Status**: ✅ Complete and Ready for Use
