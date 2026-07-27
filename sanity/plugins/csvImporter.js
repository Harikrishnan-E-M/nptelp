import {definePlugin} from 'sanity'
import {useState, useCallback} from 'react'
import {useClient, useDocumentOperation} from 'sanity'
import {useToast} from '@sanity/ui'

// ==================== CSV PARSING — NPTEL (Student) ====================
function parseCsvText(csvText) {
  const lines = csvText.split(/\r?\n/)
  lines.shift()
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

// ==================== CSV PARSING — FACULTY CERTIFICATION ====================
// Columns: S.No | Name of the Faculty | Name of Course Passed | Course Offered by (agency) | Grade obtained if any
function parseFacultyCsvText(csvText) {
  // Strip UTF-8 BOM and any leading invisible/control characters from the whole text
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')

  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

  // Helper: strip invisible Unicode chars (BOM, zero-width spaces, non-breaking space, etc.)
  const stripInvisible = (str) =>
    str.replace(/^[\uFEFF\u200B\u200C\u200D\u00A0\u202F\u2060\u3000]+/, '').trim()

  for (const line of lines) {
    if (!line.trim()) continue
    const cols = []
    let cur = ''
    let q = false

    for (const ch of line) {
      if (ch === '"') q = !q
      else if (ch === ',' && !q) {
        cols.push(stripInvisible(cur))
        cur = ''
      } else {
        cur += ch
      }
    }
    cols.push(stripInvisible(cur))

    const name = stripInvisible(cols[1] || '')
    const courseName = stripInvisible(cols[2] || '')
    if (!name) continue

    rows.push({
      name,
      courseName,
      agency: stripInvisible(cols[3] || ''),
      grade: stripInvisible(cols[4] || ''),
    })
  }

  return rows
}


// ==================== CUSTOM PUBLISH + IMPORT ACTION — NPTEL ====================
// This replaces the default "Publish" button in the academicYear document editor.
// When clicked, it publishes the document AND automatically imports the CSV data.
function PublishAndImportCsvAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const yearId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    // Step 1: Execute the standard Sanity publish
    publish.execute()

    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing document...'})

    // Step 2: Wait for publish to propagate, then import CSV
    setTimeout(async () => {
      try {
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
            status: 'success',
            title: 'Published successfully',
            description: 'No CSV file attached — nothing to import.',
          })
          setIsRunning(false)
          return
        }

        const assetId = yearDoc.csv.asset._id

        // Skip if same CSV already imported
        if (yearDoc.csvAssetId === assetId && (yearDoc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${yearDoc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing CSV...'})
        const response = await fetch(yearDoc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        // Batch-delete old records
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

        toast.push({status: 'info', title: `Creating ${rows.length} records...`})

        // Batch-create new records
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

        // Update tracking fields on the academicYear document
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
          title: `✅ Published & imported ${rows.length} records!`,
          description: 'Data is now live on the frontend.',
        })
      } catch (err) {
        console.error('CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'CSV import failed (document is still published)',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000) // Wait 2s for Sanity publish to propagate before querying
  }, [publish, isRunning, client, yearId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — FACULTY CERTIFICATION ====================
function PublishAndImportFacultyCsvAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const yearId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing document...'})

    setTimeout(async () => {
      try {
        toast.push({status: 'info', title: 'Checking CSV file...'})

        const yearDoc = await client.fetch(
          `*[_type == "facultyCertification" && _id == $yearId][0]{
            _id,
            csvAssetId,
            totalFaculty,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {yearId}
        )

        if (!yearDoc?.csv?.asset?.url) {
          toast.push({
            status: 'success',
            title: 'Published successfully',
            description: 'No CSV file attached — nothing to import.',
          })
          setIsRunning(false)
          return
        }

        const assetId = yearDoc.csv.asset._id

        // Skip if same CSV already imported
        if (yearDoc.csvAssetId === assetId && (yearDoc.completedCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: 'Records already imported from this file.',
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Faculty CSV...'})
        const response = await fetch(yearDoc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseFacultyCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        // Compute stats (totalFaculty is entered manually — do NOT overwrite it)
        const completedNames = new Set(
          rows.filter((r) => r.grade && r.grade.trim() !== '').map((r) => r.name.toLowerCase().trim())
        )
        const completedCount = completedNames.size
        const uniqueNames = new Set(rows.map((r) => r.name.toLowerCase().trim()))
        const rowCount = uniqueNames.size

        toast.push({status: 'info', title: `Found ${rows.length} rows (${rowCount} unique faculty). Deleting old data...`})

        // Batch-delete old records
        const existingIds = await client.fetch(
          '*[_type == "facultyCertData" && year._ref == $yearId]._id',
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

        toast.push({status: 'info', title: `Creating ${rows.length} faculty records...`})

        // Batch-create new records
        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'facultyCertData',
              year: {_type: 'reference', _ref: yearId, _weak: true},
              name: row.name,
              courseName: row.courseName,
              agency: row.agency,
              grade: row.grade,
            })
          })
          await tx.commit()
        }

        // Update tracking fields — do NOT overwrite totalFaculty (admin enters it manually)
        await client
          .patch(yearId)
          .set({
            completedCount,
            csvAssetId: assetId,
            csvImportedAt: new Date().toISOString(),
          })
          .commit()

        toast.push({
          status: 'success',
          title: `✅ Published & imported ${rows.length} rows!`,
          description: `${completedCount} completed. (Update Total Faculty count manually if needed.)`,
        })
      } catch (err) {
        console.error('Faculty CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Faculty CSV import failed (document is still published)',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, yearId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION ====================
// This replaces the default "Delete" button. It deletes all associated nptelData
// records first, then deletes the academicYear document.
function DeleteAndCleanupAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const yearId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    // Show confirmation dialog before deleting (optional but good practice)
    if (!window.confirm('Are you sure? This will delete the Academic Year and ALL associated NPTEL Data documents. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up associated data...'})

    try {
      // Step 1: Find all nptelData docs referencing this year
      const existingIds = await client.fetch(
        '*[_type == "nptelData" && year._ref == $yearId]._id',
        {yearId}
      )

      // Step 2: Batch delete them
      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} NPTEL records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((docId) => tx.delete(docId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Academic Year document...'})

      // Step 3: Delete the academicYear document itself via standard action
      deleteOp.execute()
      
      toast.push({
        status: 'success',
        title: 'Successfully deleted Academic Year and all its data.',
      })
    } catch (err) {
      console.error('Delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, yearId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CUSTOM DELETE ACTION — FACULTY CERTIFICATION ====================
// Deletes all associated facultyCertData records, then deletes the facultyCertification doc.
function DeleteAndCleanupFacultyAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const yearId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the Faculty Certification year AND ALL associated faculty data records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up faculty certification data...'})

    try {
      // Step 1: Find all facultyCertData docs referencing this year
      const existingIds = await client.fetch(
        '*[_type == "facultyCertData" && year._ref == $yearId]._id',
        {yearId}
      )

      // Step 2: Batch delete them
      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} faculty records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((docId) => tx.delete(docId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Faculty Certification year document...'})

      // Step 3: Delete the facultyCertification document itself
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Faculty Certification year and all its data.',
      })
    } catch (err) {
      console.error('Faculty delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated faculty data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, yearId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== PLUGIN ====================
export const csvImporterPlugin = definePlugin({
  name: 'csv-importer',
  document: {
    actions: (prev, context) => {
      // NPTEL student data — custom publish + delete
      if (context.schemaType === 'academicYear') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportCsvAction
          if (action.action === 'delete') return DeleteAndCleanupAction
          return action
        })
      }
      // Faculty Certification — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'facultyCertification') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportFacultyCsvAction
          if (action.action === 'delete') return DeleteAndCleanupFacultyAction
          return action
        })
      }
      return prev
    },
  },
})

