import {definePlugin} from 'sanity'
import {useState, useCallback} from 'react'
import {useClient, useDocumentOperation} from 'sanity'
import {useToast} from '@sanity/ui'

// ==================== CSV PARSING ====================
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

// ==================== CUSTOM PUBLISH + IMPORT ACTION ====================
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

// ==================== PLUGIN ====================
export const csvImporterPlugin = definePlugin({
  name: 'csv-importer',
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'academicYear') {
        // Replace the built-in Publish and Delete actions
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportCsvAction
          if (action.action === 'delete') return DeleteAndCleanupAction
          return action
        })
      }
      return prev
    },
  },
})

