import { createClient } from '@sanity/client';

// ── Sanity Client ──────────────────────────────────────────────────────────────
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '1asbko6r',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2024-01-30',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

// ── Strategy configuration ─────────────────────────────────────────────────────
// Maps strategy slug → { uploadType, dataType, csvCols, fieldMap }
const STRATEGY_CONFIG = {
  pbl: {
    uploadType: 'cepUpload_pbl',
    dataType:   'cepData_pbl',
    // CSV column indices (0-based): S.No, Course Code & Title, Learning Activity,
    //   Complex Engineering Problem Addressed, SDGs Mapped, Link
    csvCols: [0, 1, 2, 3, 4, 5],
    mapRow: (cols) => ({
      sNo:             parseFloat(cols[0]) || undefined,
      courseCodeTitle: cols[1] || '',
      learningActivity: cols[2] || '',
      complexProblem:  cols[3] || '',
      sdg:             cols[4] || '',
      link:            cols[5] || undefined,
    }),
  },
  projbl: {
    uploadType: 'cepUpload_projbl',
    dataType:   'cepData_projbl',
    mapRow: (cols) => ({
      sNo:             parseFloat(cols[0]) || undefined,
      courseCodeTitle: cols[1] || '',
      learningActivity: cols[2] || '',
      complexProblem:  cols[3] || '',
      sdg:             cols[4] || '',
      link:            cols[5] || undefined,
    }),
  },
  mini: {
    uploadType: 'cepUpload_mini',
    dataType:   'cepData_mini',
    mapRow: (cols) => ({
      sNo:             parseFloat(cols[0]) || undefined,
      courseCodeTitle: cols[1] || '',
      learningActivity: cols[2] || '',
      complexProblem:  cols[3] || '',
      sdg:             cols[4] || '',
      link:            cols[5] || undefined,
    }),
  },
  capstone: {
    uploadType: 'cepUpload_capstone',
    dataType:   'cepData_capstone',
    mapRow: (cols) => ({
      sNo:             parseFloat(cols[0]) || undefined,
      courseCodeTitle: cols[1] || '',
      learningActivity: cols[2] || '',
      complexProblem:  cols[3] || '',
      sdg:             cols[4] || '',
      link:            cols[5] || undefined,
    }),
  },
  idp: {
    uploadType: 'cepUpload_idp',
    dataType:   'cepData_idp',
    mapRow: (cols) => ({
      sNo:             parseFloat(cols[0]) || undefined,
      courseCodeTitle: cols[1] || '',
      learningActivity: cols[2] || '',
      complexProblem:  cols[3] || '',
      sdg:             cols[4] || '',
      link:            cols[5] || undefined,
    }),
  },
  hackathon: {
    uploadType: 'cepUpload_hackathon',
    dataType:   'cepData_hackathon',
    // CSV: S.No, Student Team, Hackathon & Problem Statement,
    //      Complex Engineering Problem Addressed, SDGs Mapped, Link
    mapRow: (cols) => ({
      sNo:              parseFloat(cols[0]) || undefined,
      studentTeam:      cols[1] || '',
      hackathonProblem: cols[2] || '',
      complexProblem:   cols[3] || '',
      sdg:              cols[4] || '',
      link:             cols[5] || undefined,
    }),
  },
  abl: {
    uploadType: 'cepUpload_abl',
    dataType:   'cepData_abl',
    // CSV: S.No, Organized By, Complex Engineering Relevance, SDGs Mapped, Link
    mapRow: (cols) => ({
      sNo:          parseFloat(cols[0]) || undefined,
      organizedBy:  cols[1] || '',
      complexProblem: cols[2] || '',
      sdg:          cols[3] || '',
      link:         cols[4] || undefined,
    }),
  },
};

// ── CSV Parser ─────────────────────────────────────────────────────────────────
function parseCsvText(csvText) {
  const lines = csvText.split(/\r?\n/);
  const parsed = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = [];
    let cur = '';
    let q = false;
    for (const ch of line) {
      if (ch === '"') { q = !q; }
      else if (ch === ',' && !q) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    parsed.push(cols);
  }
  return parsed;
}

// ── Replace all records for a strategy ────────────────────────────────────────
async function replaceStrategyData(dataType, rows) {
  // Delete existing
  const existingIds = await client.fetch(
    `*[_type == $dataType]._id`,
    { dataType }
  );
  if (existingIds.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < existingIds.length; i += batchSize) {
      const tx = client.transaction();
      existingIds.slice(i, i + batchSize).forEach((id) => tx.delete(id));
      await tx.commit();
    }
  }

  // Insert new
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const tx = client.transaction();
    rows.slice(i, i + batchSize).forEach((row) => {
      tx.create({ _type: dataType, ...row });
    });
    await tx.commit();
  }
}

// ── Import CSV from Sanity upload document ─────────────────────────────────────
async function ensureCsvImported(strategy, config) {
  const { uploadType, dataType, mapRow } = config;

  // Fetch the most recently created upload document
  const upload = await client.fetch(
    `*[_type == $uploadType] | order(_createdAt desc)[0]{
      _id,
      csvAssetId,
      dataCount,
      "csv": csvFile{asset->{_id,url}}
    }`,
    { uploadType }
  );

  if (!upload?.csv?.asset?.url) {
    return { imported: false, reason: 'no-csv' };
  }

  const assetId = upload.csv.asset._id;
  if (upload.csvAssetId === assetId && (upload.dataCount || 0) > 0) {
    return { imported: false, reason: 'up-to-date' };
  }

  // Download & parse
  const response = await fetch(upload.csv.asset.url);
  const csvText  = await response.text();
  const allLines = parseCsvText(csvText);

  // Skip header row (first row) — detect by checking if first col is "S.No" or "1"
  const dataLines = allLines.filter((cols, idx) => {
    if (idx === 0) {
      // Skip if header
      const first = (cols[0] || '').toLowerCase().trim();
      return first !== 's.no' && first !== 's.no.' && first !== 'sno';
    }
    return true;
  });

  const rows = dataLines
    .map((cols) => mapRow(cols))
    .filter((r) => {
      // Skip empty rows — must have at least one non-empty key value
      const vals = Object.values(r).filter((v) => v !== undefined && v !== '');
      return vals.length > 0;
    });

  await replaceStrategyData(dataType, rows);

  // Update tracking fields on upload doc
  await client.patch(upload._id).set({
    dataCount: rows.length,
    csvAssetId: assetId,
    csvImportedAt: new Date().toISOString(),
  }).commit();

  return { imported: true, count: rows.length };
}

// ── Serverless Handler ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { strategy } = req.query;
  if (!strategy) return res.status(400).json({ error: 'strategy param required' });

  const config = STRATEGY_CONFIG[strategy];
  if (!config) {
    return res.status(400).json({
      error: `Unknown strategy "${strategy}". Valid: ${Object.keys(STRATEGY_CONFIG).join(', ')}`,
    });
  }

  try {
    // Try to sync CSV — non-fatal if it fails
    try {
      await ensureCsvImported(strategy, config);
    } catch (importErr) {
      console.error(`CEP CSV import failed for "${strategy}":`, importErr.message);
    }

    // Fetch data
    const data = await client.fetch(
      `*[_type == $dataType] | order(sNo asc)`,
      { dataType: config.dataType }
    );

    return res.status(200).json({ strategy, data });
  } catch (err) {
    console.error('CEP strategy handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
