import { createClient } from '@sanity/client';

// ==================== SANITY CLIENT ====================
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '1asbko6r',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-30',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

// ==================== CSV PARSING ====================
function parseCsvText(csvText) {
  const lines = csvText.split(/\r?\n/);
  lines.shift(); // Remove header row
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
  // Delete existing nptelData for this year
  const existingIds = await client.fetch(
    '*[_type == "nptelData" && year._ref == $yearId]._id',
    { yearId }
  );

  for (const id of existingIds) {
    await client.delete(id);
  }

  // Insert new rows in batches of 100
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

  // Skip if already imported from same CSV asset
  if (year.csvAssetId === assetId && (year.dataCount || 0) > 0) {
    return { imported: false, reason: 'up-to-date' };
  }

  // Download and parse the CSV
  const response = await fetch(year.csv.asset.url);
  const csvText = await response.text();
  const rows = parseCsvText(csvText);

  await replaceYearData(yearId, rows);

  // Update the academicYear document to track what was imported
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

// ==================== SERVERLESS HANDLER ====================
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { yearId } = req.query;

  if (!yearId) {
    return res.status(400).json({ error: 'yearId is required' });
  }

  try {
    // Import CSV data into nptelData if needed
    await ensureCsvImported(yearId);

    // Fetch all nptelData for this year
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
      totalStudents: new Set(data.map((d) => d.regNo)).size,
      totalCourses: data.length,
      passCount: data.filter((d) => d.status === 'Accepted').length,
      failCount: data.filter((d) => d.status === 'Rejected').length,
      pendingCount: data.filter((d) => d.status === 'Pending' || !d.status).length,
      averageScore:
        data.length > 0
          ? (
              data.reduce((sum, d) => sum + (parseFloat(d.score) || 0), 0) /
              data.length
            ).toFixed(2)
          : 0,
      batches: [...new Set(data.map((d) => d.batch))],
      semesters: [...new Set(data.map((d) => d.semester))],
      data: data,
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error in statistics handler:', error);
    return res.status(500).json({ error: error.message });
  }
}
