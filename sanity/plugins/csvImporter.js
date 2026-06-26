import {definePlugin} from 'sanity'
import {useState, useCallback} from 'react'
import {useClient, useToast} from 'sanity'

// ==================== CSV PARSING (same logic as backend) ====================
function parseCsvText(csvText) {
  const lines = csvText.split(/\r?\n/)
  lines.shift() // Remove header row
  const rows = []

  for (const line of lines) {
    if (!line.trim()) continue
    const cols = []
    let cur = ''
    let q = false

    for (const ch of line) {
      if (ch === '"') q = !q
      else if (ch === ',' && !q) {
        cols.push(cur.trim())
        cur = ''
      } else {
        cur += ch
      }
    }
    cols.push(cur.trim())

    const regNo = cols[4]
    const name = cols[5]
    const courseTitle = cols[8]
    const score = cols[10]
    if (!regNo || !name || !courseTitle || !score) continue

    const year = /^\d{4}$/.test(cols[2]) ? Number(cols[2]) : null
    const proofUrl = (cols[17] || '').replace(/^"+|"+$/g, '').trim()

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
    })
  }

  return rows
}

// ==================== DOCUMENT ACTION ====================
function ImportCsvAction({id}) {
  const [isImporting, setIsImporting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  // Strip 'drafts.' prefix to get the published document ID
  const yearId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    setIsImporting(true)
    setIsDone(false)

    try {
      // Step 1: Fetch the current academicYear document
      toast.push({status: 'info', title: 'Checking CSV file...'})
      const yearDoc = await client.fetch(
        `*[_type == "academicYear" && _id == $yearId][0]{
          _id,
          csvAssetId,
          dataCount,
          "csv": csvFile{asset->{_id, url}}
        }`,
        {yearId}
      )

      if (!yearDoc?.csv?.asset?.url) {
        toast.push({
          status: 'warning',
          title: 'No CSV file found',
          description: 'Please upload a CSV file in the CSV File field first, then publish the document.',
        })
        setIsImporting(false)
        return
      }

      const assetId = yearDoc.csv.asset._id

      // Step 2: Check if already imported from same CSV
      if (yearDoc.csvAssetId === assetId && (yearDoc.dataCount || 0) > 0) {
        toast.push({
          status: 'info',
          title: 'Already up to date',
          description: `${yearDoc.dataCount} records are already imported from this CSV file.`,
        })
        setIsImporting(false)
        return
      }

      // Step 3: Download and parse CSV
      toast.push({status: 'info', title: 'Downloading CSV file...'})
      const response = await fetch(yearDoc.csv.asset.url)
      if (!response.ok) throw new Error('Failed to download CSV file')
      const csvText = await response.text()
      const rows = parseCsvText(csvText)

      if (rows.length === 0) {
        toast.push({status: 'warning', title: 'No data found in CSV', description: 'The CSV file appears to be empty or has no valid rows.'})
        setIsImporting(false)
        return
      }

      toast.push({status: 'info', title: `Found ${rows.length} records. Deleting old data...`})

      // Step 4: Delete existing nptelData records for this year (batch delete)
      const existingIds = await client.fetch(
        '*[_type == "nptelData" && year._ref == $yearId]._id',
        {yearId}
      )

      if (existingIds.length > 0) {
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((docId) => tx.delete(docId))
          await tx.commit()
        }
      }

      // Step 5: Create new nptelData records (batch create)
      toast.push({status: 'info', title: `Creating ${rows.length} records in Sanity...`})
      const batchSize = 100
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        const tx = client.transaction()
        batch.forEach((row) => {
          tx.create({
            _type: 'nptelData',
            year: {_type: 'reference', _ref: yearId, _weak: true},
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
          })
        })
        await tx.commit()
      }

      // Step 6: Update academicYear with tracking metadata
      await client
        .patch(yearId)
        .set({
          dataCount: rows.length,
          csvAssetId: assetId,
          csvImportedAt: new Date().toISOString(),
        })
        .commit()

      toast.push({
        status: 'success',
        title: `✅ Successfully imported ${rows.length} records!`,
        description: 'NPTEL data is now available in the frontend.',
      })
      setIsDone(true)
    } catch (err) {
      console.error('CSV import error:', err)
      toast.push({
        status: 'error',
        title: 'Import failed',
        description: err.message,
      })
    } finally {
      setIsImporting(false)
    }
  }, [client, yearId, toast])

  return {
    label: isImporting ? 'Importing CSV...' : isDone ? '✅ CSV Imported' : '📥 Import CSV Data',
    onHandle,
    disabled: isImporting,
    tone: isDone ? 'positive' : 'caution',
  }
}

// ==================== PLUGIN DEFINITION ====================
export const csvImporterPlugin = definePlugin({
  name: 'csv-importer',
  document: {
    actions: (prev, context) => {
      // Only add the action to academicYear documents
      if (context.schemaType === 'academicYear') {
        return [...prev, ImportCsvAction]
      }
      return prev
    },
  },
})
