import express from 'express';
import cors from 'cors';
import client from './sanityClient.js';

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// ==================== CSV PARSING (Matches original UI parser) ====================
function parseCsvText(csvText) {
  const lines = csvText.split(/\r?\n/);
  lines.shift();
  const rows = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = [];
    let cur = '';
    let q = false;

    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());

    const regNo = cols[4];
    const name = cols[5];
    const courseTitle = cols[8];
    const score = cols[10];
    if (!regNo || !name || !courseTitle || !score) continue;

    const year = /^\d{4}$/.test(cols[2]) ? Number(cols[2]) : null;
    const proofUrl = (cols[17] || '').replace(/^"+|"+$/g, '').trim();

    rows.push({
      batch: year ? `${year}-${year + 4}` : '',
      regNo,
      name,
      semester: (cols[6] || '').trim(),
      courseCode: cols[7] || '',
      courseTitle,
      credit: cols[9] || '',
      score,
      examMonth: cols[12] || '',
      examYear: cols[13] || '',
      certId: cols[14] || '',
      proofUrl,
      status: cols[20] || '',
    });
  }

  return rows;
}

async function replaceYearData(yearId, rows) {
  const existingIds = await client.fetch(
    '*[_type == "nptelData" && year._ref == $yearId]._id',
    { yearId }
  );

  for (const id of existingIds) {
    await client.delete(id);
  }

  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const tx = client.transaction();
    batch.forEach((row) => {
      tx.create({
        _type: 'nptelData',
        year: { _type: 'reference', _ref: yearId, _weak: true },
        batch: row.batch,
        regNo: row.regNo,
        name: row.name,
        semester: row.semester,
        courseCode: row.courseCode,
        courseTitle: row.courseTitle,
        credit: row.credit,
        score: row.score,
        examMonth: row.examMonth,
        examYear: row.examYear,
        certId: row.certId,
        proofUrl: row.proofUrl,
        status: row.status,
      });
    });
    await tx.commit();
  }
}

async function ensureCsvImported(yearId) {
  const year = await client.fetch(
    `*[_type == "academicYear" && _id == $yearId][0]{
      _id,
      csvAssetId,
      "csv": csvFile{asset->{_id,url}},
      dataCount
    }`,
    { yearId }
  );

  if (!year?.csv?.asset?.url) {
    return { imported: false, reason: 'no-csv' };
  }

  const assetId = year.csv.asset._id;
  if (year.csvAssetId === assetId && (year.dataCount || 0) > 0) {
    return { imported: false, reason: 'up-to-date' };
  }

  const response = await fetch(year.csv.asset.url);
  const csvText = await response.text();
  const rows = parseCsvText(csvText);

  await replaceYearData(yearId, rows);

  await client
    .patch(yearId)
    .set({
      dataCount: rows.length,
      csvAssetId: assetId,
      csvImportedAt: new Date().toISOString(),
    })
    .commit();

  return { imported: true, count: rows.length };
}

// ==================== ROUTES ====================

// Get all academic years
app.get('/api/years', async (req, res) => {
  try {
    const query = `*[_type == "academicYear"] | order(yearLabel desc) {
      _id,
      yearLabel,
      startYear,
      endYear,
      description,
      _createdAt,
      dataCount
    }`;
    const years = await client.fetch(query);
    res.json(years);
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get statistics for a specific year (read-only)
app.get('/api/statistics/:yearId', async (req, res) => {
  try {
    const { yearId } = req.params;

    await ensureCsvImported(yearId);

    const query = `*[_type == "nptelData" && year._ref == $yearId] {
      _id,
      batch,
      regNo,
      name,
      semester,
      courseCode,
      courseTitle,
      credit,
      score,
      examMonth,
      examYear,
      certId,
      proofUrl,
      status
    }`;
    
    const data = await client.fetch(query, { yearId });
    
    // Calculate statistics
    const stats = {
      totalStudents: new Set(data.map(d => d.regNo)).size,
      totalCourses: data.length,
      passCount: data.filter(d => d.status === 'Accepted').length,
      failCount: data.filter(d => d.status === 'Rejected').length,
      pendingCount: data.filter(d => d.status === 'Pending' || !d.status).length,
      averageScore: data.length > 0 ? (data.reduce((sum, d) => sum + (parseFloat(d.score) || 0), 0) / data.length).toFixed(2) : 0,
      batches: [...new Set(data.map(d => d.batch))],
      semesters: [...new Set(data.map(d => d.semester))],
      data: data
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: error.message });
  }
});


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
