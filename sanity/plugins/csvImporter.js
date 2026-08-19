import {definePlugin} from 'sanity'
import {useState, useCallback} from 'react'
import {useClient, useDocumentOperation} from 'sanity'
import {useToast} from '@sanity/ui'

// ==================== CSV PARSING — NPTEL (Student) ====================
function parseCsvText(csvText) {
  const lines = csvText.split(/\r?\n/)
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
// Columns: S.No | Name of the Faculty | Name of Course Passed | Course Offered by (agency) | Grade obtained if any | Certificate Link | Category
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

    const sNo = parseInt(stripInvisible(cols[0] || ''), 10)
    const name = stripInvisible(cols[1] || '')
    const courseName = stripInvisible(cols[2] || '')
    if (!name) continue

    rows.push({
      sNo: isNaN(sNo) ? null : sNo,
      name,
      courseName,
      agency: stripInvisible(cols[3] || ''),
      grade: stripInvisible(cols[4] || ''),
      certificateLink: stripInvisible(cols[5] || ''),
      category: stripInvisible(cols[6] || ''),
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
              sNo: row.sNo,
              name: row.name,
              courseName: row.courseName,
              agency: row.agency,
              grade: row.grade,
              certificateLink: row.certificateLink,
              category: row.category,
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

// ==================== CSV PARSING — CASE STUDY ====================
// Columns: S.No | Name | Course | Case study link
function parseCaseStudyCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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
    if (!name) continue

    rows.push({
      sNo: parseInt(cols[0], 10) || null,
      name,
      course: stripInvisible(cols[2] || ''),
      caseStudyLink: stripInvisible(cols[3] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — CASE STUDY ====================
function PublishAndImportCaseStudyCsvAction({id, type}) {
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
          `*[_type == "caseStudy" && _id == $yearId][0]{
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

        if (yearDoc.csvAssetId === assetId && (yearDoc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${yearDoc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Case Study CSV...'})
        const response = await fetch(yearDoc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseCaseStudyCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "caseStudyData" && year._ref == $yearId]._id',
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

        toast.push({status: 'info', title: `Creating ${rows.length} case study records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'caseStudyData',
              year: {_type: 'reference', _ref: yearId, _weak: true},
              sNo: row.sNo,
              name: row.name,
              course: row.course,
              caseStudyLink: row.caseStudyLink || undefined,
            })
          })
          await tx.commit()
        }

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
          title: `✅ Published & imported ${rows.length} case study records!`,
          description: 'Data is now live on the frontend.',
        })
      } catch (err) {
        console.error('Case Study CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Case Study CSV import failed (document is still published)',
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

// ==================== CUSTOM DELETE ACTION — CASE STUDY ====================
function DeleteAndCleanupCaseStudyAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const yearId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the Case Study year AND ALL associated data records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up case study data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "caseStudyData" && year._ref == $yearId]._id',
        {yearId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} case study records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((docId) => tx.delete(docId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Case Study year document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Case Study year and all its data.',
      })
    } catch (err) {
      console.error('Case Study delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated case study data',
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

// ==================== CSV PARSING — MINI PROJECT ====================
// Columns: S.No | Name | Course | Mini Project link
function parseMiniProjectCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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
    if (!name) continue

    rows.push({
      sNo: parseInt(cols[0], 10) || null,
      name,
      course: stripInvisible(cols[2] || ''),
      miniProjectLink: stripInvisible(cols[3] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — MINI PROJECT ====================
function PublishAndImportMiniProjectCsvAction({id, type}) {
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

        const doc = await client.fetch(
          `*[_type == "miniProject" && _id == $yearId][0]{
            _id,
            csvAssetId,
            dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {yearId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({
            status: 'success',
            title: 'Published successfully',
            description: 'No CSV file attached — nothing to import.',
          })
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id

        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${doc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Mini Project CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseMiniProjectCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "miniProjectData" && year._ref == $yearId]._id',
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

        toast.push({status: 'info', title: `Creating ${rows.length} mini project records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'miniProjectData',
              year: {_type: 'reference', _ref: yearId, _weak: true},
              sNo: row.sNo,
              name: row.name,
              course: row.course,
              miniProjectLink: row.miniProjectLink || undefined,
            })
          })
          await tx.commit()
        }

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
          title: `✅ Published & imported ${rows.length} mini project records!`,
          description: 'Data is now live on the frontend.',
        })
      } catch (err) {
        console.error('Mini Project CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Mini Project CSV import failed (document is still published)',
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

// ==================== CUSTOM DELETE ACTION — MINI PROJECT ====================
function DeleteAndCleanupMiniProjectAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const yearId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the Mini Project document AND ALL associated data records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up mini project data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "miniProjectData" && year._ref == $yearId]._id',
        {yearId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} mini project records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((docId) => tx.delete(docId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Mini Project document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Mini Project document and all its data.',
      })
    } catch (err) {
      console.error('Mini Project delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated mini project data',
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

// ==================== CSV PARSING — NBA ICT ====================
function parseNbaIctCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const facultyName = stripInvisible(cols[1] || '')
    if (!facultyName) continue

    rows.push({
      sNo: parseInt(cols[0], 10) || null,
      facultyName,
      courseName: stripInvisible(cols[2] || ''),
      courseLink: stripInvisible(cols[3] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — NBA ICT ====================
function PublishAndImportNbaIctCsvAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)

    setTimeout(async () => {
      try {
        const docQuery = `*[_type == "nbaIct" && _id == $docId][0]{
          _id,
          title,
          "csv": csvFile { asset->{_id, url} },
          csvAssetId,
          dataCount
        }`
        const doc = await client.fetch(docQuery, {docId})

        if (!doc) {
          toast.push({status: 'warning', title: 'NBA ICT document not found'})
          setIsRunning(false)
          return
        }

        if (!doc.csv?.asset?.url) {
          toast.push({
            status: 'info',
            title: 'Published',
            description: 'No CSV file attached to import.',
          })
          setIsRunning(false)
          return
        }

        const newAssetId = doc.csv.asset._id
        if (doc.csvAssetId === newAssetId && doc.dataCount > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${doc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing NBA ICT CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseNbaIctCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "nbaIctData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} NBA ICT records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'nbaIctData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo: row.sNo,
              facultyName: row.facultyName,
              courseName: row.courseName || undefined,
              courseLink: row.courseLink || undefined,
            })
          })
          await tx.commit()
        }

        toast.push({status: 'info', title: 'Updating NBA ICT tracking metadata...'})
        await client
          .patch(docId)
          .set({
            csvAssetId: newAssetId,
            csvImportedAt: new Date().toISOString(),
            dataCount: rows.length,
          })
          .commit()

        toast.push({
          status: 'success',
          title: 'Import Complete!',
          description: `Successfully imported ${rows.length} NBA ICT records.`,
        })
      } catch (err) {
        console.error('CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Import Failed',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — NBA ICT ====================
function DeleteAndCleanupNbaIctAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the NBA ICT document AND ALL associated data records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up NBA ICT data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "nbaIctData" && parent._ref == $docId]._id',
        {docId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} NBA ICT records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting NBA ICT document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted NBA ICT document and all its data.',
      })
    } catch (err) {
      console.error('NBA ICT delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated NBA ICT data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CSV PARSING — SEMINAR ====================
// Columns: S.No | Course | Name of the Faculty | Drive Link
function parseSeminarCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const facultyName = stripInvisible(cols[2] || '')
    if (!facultyName) continue

    rows.push({
      sNo: parseInt(cols[0], 10) || null,
      course: stripInvisible(cols[1] || ''),
      facultyName,
      driveLink: stripInvisible(cols[3] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — SEMINAR ====================
function PublishAndImportSeminarCsvAction({id, type}) {
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
          `*[_type == "seminar" && _id == $yearId][0]{
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

        if (yearDoc.csvAssetId === assetId && (yearDoc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${yearDoc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Seminar CSV...'})
        const response = await fetch(yearDoc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseSeminarCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "seminarData" && year._ref == $yearId]._id',
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

        toast.push({status: 'info', title: `Creating ${rows.length} seminar records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'seminarData',
              year: {_type: 'reference', _ref: yearId, _weak: true},
              sNo: row.sNo,
              course: row.course || undefined,
              facultyName: row.facultyName,
              driveLink: row.driveLink || undefined,
            })
          })
          await tx.commit()
        }

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
          title: `✅ Published & imported ${rows.length} seminar records!`,
          description: 'Data is now live on the frontend.',
        })
      } catch (err) {
        console.error('Seminar CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Seminar CSV import failed (document is still published)',
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

// ==================== CUSTOM DELETE ACTION — SEMINAR ====================
function DeleteAndCleanupSeminarAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const yearId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the Seminar year AND ALL associated data records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up seminar data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "seminarData" && year._ref == $yearId]._id',
        {yearId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} seminar records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((docId) => tx.delete(docId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Seminar year document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Seminar year and all its data.',
      })
    } catch (err) {
      console.error('Seminar delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated seminar data',
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

// ==================== CSV PARSING — CO-CURRICULAR SDG ====================
// Columns: S.No | Course Code & Title | Type of Learning / Activity |
//   Relevance to Complex Engineering Problems | Sustainable Development Goals |
//   Problem Statement | Link
function parseCoCurricularSdgCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const courseCodeTitle = stripInvisible(cols[1] || '')
    if (!courseCodeTitle) continue

    rows.push({
      sNo:                parseInt(cols[0], 10) || null,
      courseCodeTitle,
      typeOfLearning:     stripInvisible(cols[2] || ''),
      relevanceToComplex: stripInvisible(cols[3] || ''),
      sdg:                stripInvisible(cols[4] || ''),
      problemStatement:   stripInvisible(cols[5] || ''),
      link:               stripInvisible(cols[6] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — CO-CURRICULAR SDG ====================
function PublishAndImportCoCurricularSdgAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing document...'})

    setTimeout(async () => {
      try {
        toast.push({status: 'info', title: 'Checking CSV file...'})

        const doc = await client.fetch(
          `*[_type == "coCurricularSdg" && _id == $docId][0]{
            _id,
            csvAssetId,
            dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({
            status: 'success',
            title: 'Published successfully',
            description: 'No CSV file attached — nothing to import.',
          })
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id

        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${doc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Co-Curricular SDG CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseCoCurricularSdgCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        // Delete ALL existing coCurricularSdgData (no parent filter — global table)
        const existingIds = await client.fetch('*[_type == "coCurricularSdgData"]._id')
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'coCurricularSdgData',
              sNo:                row.sNo,
              courseCodeTitle:    row.courseCodeTitle,
              typeOfLearning:     row.typeOfLearning   || undefined,
              relevanceToComplex: row.relevanceToComplex || undefined,
              sdg:                row.sdg              || undefined,
              problemStatement:   row.problemStatement || undefined,
              link:               row.link             || undefined,
            })
          })
          await tx.commit()
        }

        await client
          .patch(docId)
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
        console.error('Co-Curricular SDG CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Co-Curricular SDG CSV import failed (document is still published)',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — CO-CURRICULAR SDG ====================
function DeleteAndCleanupCoCurricularSdgAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the upload document AND ALL Co-Curricular SDG data records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up co-curricular SDG data...'})

    try {
      const existingIds = await client.fetch('*[_type == "coCurricularSdgData"]._id')

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting upload document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Co-Curricular SDG upload document and all data.',
      })
    } catch (err) {
      console.error('Co-Curricular SDG delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete Co-Curricular SDG data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, toast])

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
      // Case Study — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'caseStudy') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportCaseStudyCsvAction
          if (action.action === 'delete') return DeleteAndCleanupCaseStudyAction
          return action
        })
      }
      // Mini Project — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'miniProject') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportMiniProjectCsvAction
          if (action.action === 'delete') return DeleteAndCleanupMiniProjectAction
          return action
        })
      }
      // Non Formal — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'nonFormal') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportNonFormalCsvAction
          if (action.action === 'delete') return DeleteAndCleanupNonFormalAction
          return action
        })
      }
      // Journal — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'journal') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportJournalCsvAction
          if (action.action === 'delete') return DeleteAndCleanupJournalAction
          return action
        })
      }
      // Scopus — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'scopus') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportScopusCsvAction
          if (action.action === 'delete') return DeleteAndCleanupScopusAction
          return action
        })
      }
      // Freelancing Internship — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'freelancingInternship') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportFreelancingCsvAction
          if (action.action === 'delete') return DeleteAndCleanupFreelancingAction
          return action
        })
      }
      // Placement Internship — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'placementInternship') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportPlacementCsvAction
          if (action.action === 'delete') return DeleteAndCleanupPlacementAction
          return action
        })
      }
      // NBA ICT — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'nbaIct') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportNbaIctCsvAction
          if (action.action === 'delete') return DeleteAndCleanupNbaIctAction
          return action
        })
      }
      // Seminar — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'seminar') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportSeminarCsvAction
          if (action.action === 'delete') return DeleteAndCleanupSeminarAction
          return action
        })
      }
      // Industrial Involvement — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'industrialInvolvement') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportIndustrialInvolvementCsvAction
          if (action.action === 'delete') return DeleteAndCleanupIndustrialInvolvementAction
          return action
        })
      }
      // Guest Lecture — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'guestLecture') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportGuestLectureCsvAction
          if (action.action === 'delete') return DeleteAndCleanupGuestLectureAction
          return action
        })
      }
      // Co-Curricular SDG — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'coCurricularSdg') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportCoCurricularSdgAction
          if (action.action === 'delete') return DeleteAndCleanupCoCurricularSdgAction
          return action
        })
      }
      // CEP — Problem-Based Learning
      if (context.schemaType === 'cepUpload_pbl') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportCepPblAction
          if (action.action === 'delete') return DeleteAndCleanupCepPblAction
          return action
        })
      }
      // CEP — Project-Based Learning
      if (context.schemaType === 'cepUpload_projbl') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportCepProjblAction
          if (action.action === 'delete') return DeleteAndCleanupCepProjblAction
          return action
        })
      }
      // CEP — Mini Projects
      if (context.schemaType === 'cepUpload_mini') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportCepMiniAction
          if (action.action === 'delete') return DeleteAndCleanupCepMiniAction
          return action
        })
      }
      // CEP — Capstone Projects
      if (context.schemaType === 'cepUpload_capstone') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportCepCapstoneAction
          if (action.action === 'delete') return DeleteAndCleanupCepCapstoneAction
          return action
        })
      }
      // CEP — Integrated Design Projects
      if (context.schemaType === 'cepUpload_idp') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportCepIdpAction
          if (action.action === 'delete') return DeleteAndCleanupCepIdpAction
          return action
        })
      }
      // CEP — Hackathons
      if (context.schemaType === 'cepUpload_hackathon') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportCepHackathonAction
          if (action.action === 'delete') return DeleteAndCleanupCepHackathonAction
          return action
        })
      }
      // CEP — Activity Based Learning
      if (context.schemaType === 'cepUpload_abl') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportCepAblAction
          if (action.action === 'delete') return DeleteAndCleanupCepAblAction
          return action
        })
      }
      // 6.2 Journal
      if (context.schemaType === 'nba62Journal') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportNba62JournalAction
          if (action.action === 'delete') return DeleteAndCleanupNba62JournalAction
          return action
        })
      }
      // 6.2 Conference
      if (context.schemaType === 'nba62Conference') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportNba62ConferenceAction
          if (action.action === 'delete') return DeleteAndCleanupNba62ConferenceAction
          return action
        })
      }
      // 6.2 Book
      if (context.schemaType === 'nba62Book') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportNba62BookAction
          if (action.action === 'delete') return DeleteAndCleanupNba62BookAction
          return action
        })
      }
      // 6.2.3 Faculty Developmental Activities
      if (context.schemaType === 'nba623FacultyDev') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportNba623FacultyDevAction
          if (action.action === 'delete') return DeleteAndCleanupNba623FacultyDevAction
          return action
        })
      }
      // 6.2.3 Patent
      if (context.schemaType === 'nba623Patent') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportNba623PatentAction
          if (action.action === 'delete') return DeleteAndCleanupNba623PatentAction
          return action
        })
      }
      // Infosys Springboard Certification — coordinator (CSV import + cascade delete)
      if (context.schemaType === 'infospringCoord') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportInfospringAction
          if (action.action === 'delete') return DeleteAndCleanupInfospringAction
          return action
        })
      }
      return prev
    },
  },
})

// ==================== CSV PARSING — NON FORMAL ====================
// Columns: s.no | Student Name | Roll Number | Section | Number of Non formal Course Completed
//          | Course Name 1 | Proof 1 | Course Name 2 | Proof 2
function parseNonFormalCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    // col[0] = s.no (skip), col[1] = Student Name
    const studentName = stripInvisible(cols[1] || '')
    if (!studentName) continue

    rows.push({
      studentName,
      rollNumber:           stripInvisible(cols[2] || ''),
      section:              stripInvisible(cols[3] || ''),
      nonFormalCourseCount: parseInt(cols[4], 10) || null,
      courseName1:          stripInvisible(cols[5] || ''),
      proof1:               stripInvisible(cols[6] || ''),
      courseName2:          stripInvisible(cols[7] || ''),
      proof2:               stripInvisible(cols[8] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — NON FORMAL ====================
function PublishAndImportNonFormalCsvAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing document...'})

    setTimeout(async () => {
      try {
        toast.push({status: 'info', title: 'Checking CSV file...'})

        const doc = await client.fetch(
          `*[_type == "nonFormal" && _id == $docId][0]{
            _id,
            csvAssetId,
            dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({
            status: 'success',
            title: 'Published successfully',
            description: 'No CSV file attached — nothing to import.',
          })
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id

        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${doc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Non Formal CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseNonFormalCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "nonFormalData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} non formal records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'nonFormalData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              studentName:          row.studentName,
              rollNumber:           row.rollNumber || undefined,
              section:              row.section || undefined,
              nonFormalCourseCount: row.nonFormalCourseCount,
              courseName1:          row.courseName1 || undefined,
              proof1:               row.proof1 || undefined,
              courseName2:          row.courseName2 || undefined,
              proof2:               row.proof2 || undefined,
            })
          })
          await tx.commit()
        }

        await client
          .patch(docId)
          .set({
            dataCount: rows.length,
            csvAssetId: assetId,
            csvImportedAt: new Date().toISOString(),
          })
          .commit()

        toast.push({
          status: 'success',
          title: `✅ Published & imported ${rows.length} non formal records!`,
          description: 'Data is now live on the frontend.',
        })
      } catch (err) {
        console.error('Non Formal CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Non Formal CSV import failed (document is still published)',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — NON FORMAL ====================
function DeleteAndCleanupNonFormalAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the Non Formal document AND ALL associated data records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up non formal data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "nonFormalData" && parent._ref == $docId]._id',
        {docId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} non formal records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Non Formal document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Non Formal document and all its data.',
      })
    } catch (err) {
      console.error('Non Formal delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated non formal data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}
// ==================== CSV PARSING — JOURNAL ====================
// Columns: S.No | Name of the student | Title of the paper | Journal/Conference details | Scopus/SCI | Web link of the paper | year
function parseJournalCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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
    if (!name) continue // Must have student name

    rows.push({
      sNo: parseInt(cols[0], 10) || null,
      studentName: name,
      paperTitle: stripInvisible(cols[2] || ''),
      journalDetails: stripInvisible(cols[3] || ''),
      scopusSci: stripInvisible(cols[4] || ''),
      webLink: stripInvisible(cols[5] || ''),
      year: stripInvisible(cols[6] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — JOURNAL ====================
function PublishAndImportJournalCsvAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)

    setTimeout(async () => {
      try {
        const docQuery = `*[_type == "journal" && _id == $docId][0]{
          _id,
          title,
          "csv": csvFile { asset->{_id, url} },
          csvAssetId,
          dataCount
        }`
        const journalDoc = await client.fetch(docQuery, {docId})

        if (!journalDoc) {
          toast.push({status: 'warning', title: 'Journal document not found'})
          setIsRunning(false)
          return
        }

        if (!journalDoc.csv?.asset?.url) {
          toast.push({
            status: 'info',
            title: 'Published',
            description: 'No CSV file attached to import.',
          })
          setIsRunning(false)
          return
        }

        const newAssetId = journalDoc.csv.asset._id
        if (journalDoc.csvAssetId === newAssetId && journalDoc.dataCount > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${journalDoc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Journal CSV...'})
        const response = await fetch(journalDoc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseJournalCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "journalData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} journal records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'journalData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo: row.sNo,
              studentName: row.studentName,
              paperTitle: row.paperTitle || undefined,
              journalDetails: row.journalDetails || undefined,
              scopusSci: row.scopusSci || undefined,
              webLink: row.webLink || undefined,
              year: row.year || undefined,
            })
          })
          await tx.commit()
        }

        toast.push({status: 'info', title: 'Updating Journal tracking metadata...'})
        await client
          .patch(docId)
          .set({
            csvAssetId: newAssetId,
            csvImportedAt: new Date().toISOString(),
            dataCount: rows.length,
          })
          .commit()

        toast.push({
          status: 'success',
          title: 'Import Complete!',
          description: `Successfully imported ${rows.length} journal records.`,
        })
      } catch (err) {
        console.error('CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Import Failed',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — JOURNAL ====================
function DeleteAndCleanupJournalAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the Journal document AND ALL associated data records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up journal data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "journalData" && parent._ref == $docId]._id',
        {docId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} journal records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Journal document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Journal document and all its data.',
      })
    } catch (err) {
      console.error('Journal delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated journal data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}
// ==================== CSV PARSING — SCOPUS ====================
// Columns: SI.No | Title of the paper | Name of the Conference/Venue
//          | International/National | Date | Authors | Indexed | Publisher | Website link
function parseScopusCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const paperTitle = stripInvisible(cols[1] || '')
    if (!paperTitle) continue // must have a title

    rows.push({
      sNo:            parseInt(cols[0], 10) || null,
      paperTitle,
      conferenceName: stripInvisible(cols[2] || ''),
      intlNational:   stripInvisible(cols[3] || ''),
      date:           stripInvisible(cols[4] || ''),
      authors:        stripInvisible(cols[5] || ''),
      indexed:        stripInvisible(cols[6] || ''),
      publisher:      stripInvisible(cols[7] || ''),
      webLink:        stripInvisible(cols[8] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — SCOPUS ====================
function PublishAndImportScopusCsvAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing document...'})

    setTimeout(async () => {
      try {
        toast.push({status: 'info', title: 'Checking CSV file...'})

        const doc = await client.fetch(
          `*[_type == "scopus" && _id == $docId][0]{
            _id,
            csvAssetId,
            dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({
            status: 'success',
            title: 'Published successfully',
            description: 'No CSV file attached — nothing to import.',
          })
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id

        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${doc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Scopus CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseScopusCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "scopusData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} Scopus records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'scopusData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo:            row.sNo,
              paperTitle:     row.paperTitle,
              conferenceName: row.conferenceName || undefined,
              intlNational:   row.intlNational || undefined,
              date:           row.date || undefined,
              authors:        row.authors || undefined,
              indexed:        row.indexed || undefined,
              publisher:      row.publisher || undefined,
              webLink:        row.webLink || undefined,
            })
          })
          await tx.commit()
        }

        await client
          .patch(docId)
          .set({
            dataCount: rows.length,
            csvAssetId: assetId,
            csvImportedAt: new Date().toISOString(),
          })
          .commit()

        toast.push({
          status: 'success',
          title: `✅ Published & imported ${rows.length} Scopus records!`,
          description: 'Data is now live on the frontend.',
        })
      } catch (err) {
        console.error('Scopus CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Scopus CSV import failed (document is still published)',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — SCOPUS ====================
function DeleteAndCleanupScopusAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the Scopus year AND ALL associated records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up Scopus data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "scopusData" && parent._ref == $docId]._id',
        {docId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} Scopus records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Scopus year document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Scopus year and all its data.',
      })
    } catch (err) {
      console.error('Scopus delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated Scopus data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CSV PARSING — 6.2 JOURNAL ====================
// Columns: S.No | Faculty Name | Co-Authors | Paper Title | Journal Name
//          | Type of Journal (SCI/SCIE/SCOPUS) | Published Month/Year
//          | Volume Number | Issue Number | Page Number | DOI Link | Quartile Rank
function parseNba62JournalCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const facultyName = stripInvisible(cols[1] || '')
    if (!facultyName) continue // must have faculty name

    rows.push({
      sNo:               parseInt(cols[0], 10) || null,
      facultyName,
      coAuthors:         stripInvisible(cols[2] || ''),
      paperTitle:        stripInvisible(cols[3] || ''),
      journalName:       stripInvisible(cols[4] || ''),
      typeOfJournal:     stripInvisible(cols[5] || ''),
      publishedMonthYear:stripInvisible(cols[6] || ''),
      volumeNumber:      stripInvisible(cols[7] || ''),
      issueNumber:       stripInvisible(cols[8] || ''),
      pageNumber:        stripInvisible(cols[9] || ''),
      doiLink:           stripInvisible(cols[10] || ''),
      quartileRank:      stripInvisible(cols[11] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — 6.2 JOURNAL ====================
function PublishAndImportNba62JournalAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing 6.2 Journal document...'})

    setTimeout(async () => {
      try {
        const doc = await client.fetch(
          `*[_type == "nba62Journal" && _id == $docId][0]{
            _id, csvAssetId, dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({status: 'success', title: 'Published', description: 'No CSV file attached — nothing to import.'})
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id
        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({status: 'success', title: 'Published! CSV already up to date.', description: `${doc.dataCount} records already imported.`})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing 6.2 Journal CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseNba62JournalCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "nba62JournalData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} 6.2 Journal records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'nba62JournalData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo:                row.sNo,
              facultyName:        row.facultyName,
              coAuthors:          row.coAuthors || undefined,
              paperTitle:         row.paperTitle || undefined,
              journalName:        row.journalName || undefined,
              typeOfJournal:      row.typeOfJournal || undefined,
              publishedMonthYear: row.publishedMonthYear || undefined,
              volumeNumber:       row.volumeNumber || undefined,
              issueNumber:        row.issueNumber || undefined,
              pageNumber:         row.pageNumber || undefined,
              doiLink:            row.doiLink || undefined,
              quartileRank:       row.quartileRank || undefined,
            })
          })
          await tx.commit()
        }

        await client.patch(docId).set({
          dataCount: rows.length,
          csvAssetId: assetId,
          csvImportedAt: new Date().toISOString(),
        }).commit()

        toast.push({status: 'success', title: `✅ Published & imported ${rows.length} 6.2 Journal records!`})
      } catch (err) {
        console.error('6.2 Journal CSV import error:', err)
        toast.push({status: 'error', title: '6.2 Journal CSV import failed', description: err.message})
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — 6.2 JOURNAL ====================
function DeleteAndCleanupNba62JournalAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return
    if (!window.confirm('Are you sure? This will delete the 6.2 Journal document AND ALL associated data records. This cannot be undone.')) return

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up 6.2 Journal data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "nba62JournalData" && parent._ref == $docId]._id',
        {docId}
      )
      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }
      deleteOp.execute()
      toast.push({status: 'success', title: 'Successfully deleted 6.2 Journal document and all its data.'})
    } catch (err) {
      console.error('6.2 Journal delete error:', err)
      toast.push({status: 'error', title: 'Failed to delete 6.2 Journal data', description: err.message})
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CSV PARSING — 6.2 CONFERENCE ====================
// Columns: S.No | Faculty Name | Authors | Paper Title | Conference Name | Venue | Published Month/Year | Link
function parseNba62ConferenceCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const facultyName = stripInvisible(cols[1] || '')
    if (!facultyName) continue

    rows.push({
      sNo:               parseInt(cols[0], 10) || null,
      facultyName,
      authors:           stripInvisible(cols[2] || ''),
      paperTitle:        stripInvisible(cols[3] || ''),
      conferenceName:    stripInvisible(cols[4] || ''),
      venue:             stripInvisible(cols[5] || ''),
      publishedMonthYear:stripInvisible(cols[6] || ''),
      link:              stripInvisible(cols[7] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — 6.2 CONFERENCE ====================
function PublishAndImportNba62ConferenceAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing 6.2 Conference document...'})

    setTimeout(async () => {
      try {
        const doc = await client.fetch(
          `*[_type == "nba62Conference" && _id == $docId][0]{
            _id, csvAssetId, dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({status: 'success', title: 'Published', description: 'No CSV file attached — nothing to import.'})
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id
        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({status: 'success', title: 'Published! CSV already up to date.', description: `${doc.dataCount} records already imported.`})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing 6.2 Conference CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseNba62ConferenceCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "nba62ConferenceData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} 6.2 Conference records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'nba62ConferenceData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo:                row.sNo,
              facultyName:        row.facultyName,
              authors:            row.authors || undefined,
              paperTitle:         row.paperTitle || undefined,
              conferenceName:     row.conferenceName || undefined,
              venue:              row.venue || undefined,
              publishedMonthYear: row.publishedMonthYear || undefined,
              link:               row.link || undefined,
            })
          })
          await tx.commit()
        }

        await client.patch(docId).set({
          dataCount: rows.length,
          csvAssetId: assetId,
          csvImportedAt: new Date().toISOString(),
        }).commit()

        toast.push({status: 'success', title: `✅ Published & imported ${rows.length} 6.2 Conference records!`})
      } catch (err) {
        console.error('6.2 Conference CSV import error:', err)
        toast.push({status: 'error', title: '6.2 Conference CSV import failed', description: err.message})
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — 6.2 CONFERENCE ====================
function DeleteAndCleanupNba62ConferenceAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return
    if (!window.confirm('Are you sure? This will delete the 6.2 Conference document AND ALL associated data records. This cannot be undone.')) return

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up 6.2 Conference data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "nba62ConferenceData" && parent._ref == $docId]._id',
        {docId}
      )
      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }
      deleteOp.execute()
      toast.push({status: 'success', title: 'Successfully deleted 6.2 Conference document and all its data.'})
    } catch (err) {
      console.error('6.2 Conference delete error:', err)
      toast.push({status: 'error', title: 'Failed to delete 6.2 Conference data', description: err.message})
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CSV PARSING — 6.2 BOOK ====================
// Columns: S.No | Faculty Name | Authors | Paper Title | Title of the Book/Book Chapter | Published Month/Year | Link
function parseNba62BookCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const facultyName = stripInvisible(cols[1] || '')
    if (!facultyName) continue

    rows.push({
      sNo:               parseInt(cols[0], 10) || null,
      facultyName,
      authors:           stripInvisible(cols[2] || ''),
      paperTitle:        stripInvisible(cols[3] || ''),
      bookTitle:         stripInvisible(cols[4] || ''),
      publishedMonthYear:stripInvisible(cols[5] || ''),
      link:              stripInvisible(cols[6] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — 6.2 BOOK ====================
function PublishAndImportNba62BookAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing 6.2 Book document...'})

    setTimeout(async () => {
      try {
        const doc = await client.fetch(
          `*[_type == "nba62Book" && _id == $docId][0]{
            _id, csvAssetId, dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({status: 'success', title: 'Published', description: 'No CSV file attached — nothing to import.'})
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id
        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({status: 'success', title: 'Published! CSV already up to date.', description: `${doc.dataCount} records already imported.`})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing 6.2 Book CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseNba62BookCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "nba62BookData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} 6.2 Book records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'nba62BookData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo:                row.sNo,
              facultyName:        row.facultyName,
              authors:            row.authors || undefined,
              paperTitle:         row.paperTitle || undefined,
              bookTitle:          row.bookTitle || undefined,
              publishedMonthYear: row.publishedMonthYear || undefined,
              link:               row.link || undefined,
            })
          })
          await tx.commit()
        }

        await client.patch(docId).set({
          dataCount: rows.length,
          csvAssetId: assetId,
          csvImportedAt: new Date().toISOString(),
        }).commit()

        toast.push({status: 'success', title: `✅ Published & imported ${rows.length} 6.2 Book records!`})
      } catch (err) {
        console.error('6.2 Book CSV import error:', err)
        toast.push({status: 'error', title: '6.2 Book CSV import failed', description: err.message})
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — 6.2 BOOK ====================
function DeleteAndCleanupNba62BookAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return
    if (!window.confirm('Are you sure? This will delete the 6.2 Book document AND ALL associated data records. This cannot be undone.')) return

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up 6.2 Book data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "nba62BookData" && parent._ref == $docId]._id',
        {docId}
      )
      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }
      deleteOp.execute()
      toast.push({status: 'success', title: 'Successfully deleted 6.2 Book document and all its data.'})
    } catch (err) {
      console.error('6.2 Book delete error:', err)
      toast.push({status: 'error', title: 'Failed to delete 6.2 Book data', description: err.message})
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CSV PARSING — 6.2.3 FACULTY DEV. ACTIVITIES ====================
// Columns: S.No | Name of The Faculty | Year/Sem | Subject Code | Subject Name | Working models and prototypes developed (Description) | Link
function parseNba623FacultyDevCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const facultyName = stripInvisible(cols[1] || '')
    if (!facultyName) continue

    rows.push({
      sNo:         parseInt(cols[0], 10) || null,
      facultyName,
      yearSem:     stripInvisible(cols[2] || ''),
      subjectCode: stripInvisible(cols[3] || ''),
      subjectName: stripInvisible(cols[4] || ''),
      description: stripInvisible(cols[5] || ''),
      link:        stripInvisible(cols[6] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — 6.2.3 FACULTY DEV ====================
function PublishAndImportNba623FacultyDevAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing 6.2.3 Faculty Dev. document...'})

    setTimeout(async () => {
      try {
        const doc = await client.fetch(
          `*[_type == "nba623FacultyDev" && _id == $docId][0]{
            _id, csvAssetId, dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({status: 'success', title: 'Published', description: 'No CSV file attached — nothing to import.'})
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id
        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({status: 'success', title: 'Published! CSV already up to date.', description: `${doc.dataCount} records already imported.`})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing 6.2.3 Faculty Dev CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseNba623FacultyDevCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "nba623FacultyDevData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} 6.2.3 Faculty Dev records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'nba623FacultyDevData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo:         row.sNo,
              facultyName: row.facultyName,
              yearSem:     row.yearSem || undefined,
              subjectCode: row.subjectCode || undefined,
              subjectName: row.subjectName || undefined,
              description: row.description || undefined,
              link:        row.link || undefined,
            })
          })
          await tx.commit()
        }

        await client.patch(docId).set({
          dataCount: rows.length,
          csvAssetId: assetId,
          csvImportedAt: new Date().toISOString(),
        }).commit()

        toast.push({status: 'success', title: `✅ Published & imported ${rows.length} 6.2.3 Faculty Dev records!`})
      } catch (err) {
        console.error('6.2.3 Faculty Dev CSV import error:', err)
        toast.push({status: 'error', title: '6.2.3 Faculty Dev CSV import failed', description: err.message})
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — 6.2.3 FACULTY DEV ====================
function DeleteAndCleanupNba623FacultyDevAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return
    if (!window.confirm('Are you sure? This will delete the 6.2.3 Faculty Dev document AND ALL associated data records. This cannot be undone.')) return

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up 6.2.3 Faculty Dev data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "nba623FacultyDevData" && parent._ref == $docId]._id',
        {docId}
      )
      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }
      deleteOp.execute()
      toast.push({status: 'success', title: 'Successfully deleted 6.2.3 Faculty Dev document and all its data.'})
    } catch (err) {
      console.error('6.2.3 Faculty Dev delete error:', err)
      toast.push({status: 'error', title: 'Failed to delete 6.2.3 Faculty Dev data', description: err.message})
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CSV PARSING — 6.2.3 PATENT ====================
// Columns: S.No | Dept | Title of Invention | Patent Application Number | Status | Name of the Inventors / Department (KEC Alone) | Link
function parseNba623PatentCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const titleOfInvention = stripInvisible(cols[2] || '')
    if (!titleOfInvention) continue

    rows.push({
      sNo:                    parseInt(cols[0], 10) || null,
      dept:                   stripInvisible(cols[1] || ''),
      titleOfInvention,
      patentApplicationNumber: stripInvisible(cols[3] || ''),
      status:                 stripInvisible(cols[4] || ''),
      inventors:              stripInvisible(cols[5] || ''),
      link:                   stripInvisible(cols[6] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — 6.2.3 PATENT ====================
function PublishAndImportNba623PatentAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing 6.2.3 Patent document...'})

    setTimeout(async () => {
      try {
        const doc = await client.fetch(
          `*[_type == "nba623Patent" && _id == $docId][0]{
            _id, csvAssetId, dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({status: 'success', title: 'Published', description: 'No CSV file attached — nothing to import.'})
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id
        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({status: 'success', title: 'Published! CSV already up to date.', description: `${doc.dataCount} records already imported.`})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing 6.2.3 Patent CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseNba623PatentCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "nba623PatentData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} Patent records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'nba623PatentData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo:                     row.sNo,
              dept:                    row.dept || undefined,
              titleOfInvention:        row.titleOfInvention,
              patentApplicationNumber: row.patentApplicationNumber || undefined,
              status:                  row.status || undefined,
              inventors:               row.inventors || undefined,
              link:                    row.link || undefined,
            })
          })
          await tx.commit()
        }

        await client.patch(docId).set({
          dataCount: rows.length,
          csvAssetId: assetId,
          csvImportedAt: new Date().toISOString(),
        }).commit()

        toast.push({status: 'success', title: `✅ Published & imported ${rows.length} Patent records!`})
      } catch (err) {
        console.error('6.2.3 Patent CSV import error:', err)
        toast.push({status: 'error', title: '6.2.3 Patent CSV import failed', description: err.message})
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — 6.2.3 PATENT ====================
function DeleteAndCleanupNba623PatentAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return
    if (!window.confirm('Are you sure? This will delete the 6.2.3 Patent document AND ALL associated data records. This cannot be undone.')) return

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up 6.2.3 Patent data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "nba623PatentData" && parent._ref == $docId]._id',
        {docId}
      )
      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }
      deleteOp.execute()
      toast.push({status: 'success', title: 'Successfully deleted 6.2.3 Patent document and all its data.'})
    } catch (err) {
      console.error('6.2.3 Patent delete error:', err)
      toast.push({status: 'error', title: 'Failed to delete 6.2.3 Patent data', description: err.message})
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CSV PARSING — FREELANCING INTERNSHIP ====================
// Columns: Sno | Roll No. | Name | Year | Section | Start Date | End Date
//          | Total Duration | Company Detail | Intern Offer Letter | Completion link
function parseFreelancingCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const studentName = stripInvisible(cols[2] || '')
    if (!studentName) continue

    rows.push({
      sNo:             parseInt(cols[0], 10) || null,
      rollNo:          stripInvisible(cols[1] || ''),
      studentName,
      year:            stripInvisible(cols[3] || ''),
      section:         stripInvisible(cols[4] || ''),
      startDate:       stripInvisible(cols[5] || ''),
      endDate:         stripInvisible(cols[6] || ''),
      totalDuration:   stripInvisible(cols[7] || ''),
      companyDetail:   stripInvisible(cols[8] || ''),
      offerLetterLink: stripInvisible(cols[9] || ''),
      completionLink:  stripInvisible(cols[10] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — FREELANCING INTERNSHIP ====================
function PublishAndImportFreelancingCsvAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing document...'})

    setTimeout(async () => {
      try {
        toast.push({status: 'info', title: 'Checking CSV file...'})

        const doc = await client.fetch(
          `*[_type == "freelancingInternship" && _id == $docId][0]{
            _id,
            csvAssetId,
            dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({
            status: 'success',
            title: 'Published successfully',
            description: 'No CSV file attached — nothing to import.',
          })
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id

        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${doc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Freelancing Internship CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseFreelancingCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "freelancingInternshipData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} internship records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'freelancingInternshipData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo:             row.sNo,
              rollNo:          row.rollNo || undefined,
              studentName:     row.studentName,
              year:            row.year || undefined,
              section:         row.section || undefined,
              startDate:       row.startDate || undefined,
              endDate:         row.endDate || undefined,
              totalDuration:   row.totalDuration || undefined,
              companyDetail:   row.companyDetail || undefined,
              offerLetterLink: row.offerLetterLink || undefined,
              completionLink:  row.completionLink || undefined,
            })
          })
          await tx.commit()
        }

        await client
          .patch(docId)
          .set({
            dataCount: rows.length,
            csvAssetId: assetId,
            csvImportedAt: new Date().toISOString(),
          })
          .commit()

        toast.push({
          status: 'success',
          title: `✅ Published & imported ${rows.length} internship records!`,
          description: 'Data is now live on the frontend.',
        })
      } catch (err) {
        console.error('Freelancing Internship CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Freelancing Internship CSV import failed (document is still published)',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — FREELANCING INTERNSHIP ====================
function DeleteAndCleanupFreelancingAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the Freelancing Internship year AND ALL associated records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up freelancing internship data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "freelancingInternshipData" && parent._ref == $docId]._id',
        {docId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} internship records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Freelancing Internship year document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Freelancing Internship year and all its data.',
      })
    } catch (err) {
      console.error('Freelancing Internship delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated freelancing internship data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CSV PARSING — PLACEMENT INTERNSHIP ====================
// Columns: S.No | Roll Number | Student Name | Company & Location | From Date | To Date
//          | Duration / No. of Days | Stipend | Internship Type
function parsePlacementCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const studentName = stripInvisible(cols[2] || '')
    if (!studentName) continue

    rows.push({
      sNo:                parseInt(cols[0], 10) || null,
      rollNumber:         stripInvisible(cols[1] || ''),
      studentName,
      companyAndLocation: stripInvisible(cols[3] || ''),
      fromDate:           stripInvisible(cols[4] || ''),
      toDate:             stripInvisible(cols[5] || ''),
      duration:           stripInvisible(cols[6] || ''),
      stipend:            stripInvisible(cols[7] || ''),
      internshipType:     stripInvisible(cols[8] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — PLACEMENT INTERNSHIP ====================
function PublishAndImportPlacementCsvAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing document...'})

    setTimeout(async () => {
      try {
        toast.push({status: 'info', title: 'Checking CSV file...'})

        const doc = await client.fetch(
          `*[_type == "placementInternship" && _id == $docId][0]{
            _id,
            csvAssetId,
            dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({
            status: 'success',
            title: 'Published successfully',
            description: 'No CSV file attached — nothing to import.',
          })
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id

        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${doc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Placement Internship CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parsePlacementCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "placementInternshipData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} internship records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'placementInternshipData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo:                row.sNo,
              rollNumber:         row.rollNumber || undefined,
              studentName:        row.studentName,
              companyAndLocation: row.companyAndLocation || undefined,
              fromDate:           row.fromDate || undefined,
              toDate:             row.toDate || undefined,
              duration:           row.duration || undefined,
              stipend:            row.stipend || undefined,
              internshipType:     row.internshipType || undefined,
            })
          })
          await tx.commit()
        }

        await client
          .patch(docId)
          .set({
            dataCount: rows.length,
            csvAssetId: assetId,
            csvImportedAt: new Date().toISOString(),
          })
          .commit()

        toast.push({
          status: 'success',
          title: `✅ Published & imported ${rows.length} internship records!`,
          description: 'Data is now live on the frontend.',
        })
      } catch (err) {
        console.error('Placement Internship CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Placement Internship CSV import failed (document is still published)',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — PLACEMENT INTERNSHIP ====================
function DeleteAndCleanupPlacementAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the Placement Internship year AND ALL associated records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up placement internship data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "placementInternshipData" && parent._ref == $docId]._id',
        {docId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} internship records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Placement Internship year document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Placement Internship year and all its data.',
      })
    } catch (err) {
      console.error('Placement Internship delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated placement internship data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CSV PARSING — INDUSTRIAL INVOLVEMENT ====================
// Columns: S.No | Date | Industry Expert | Designation | Course Name | Link
function parseIndustrialInvolvementCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const industryExpert = stripInvisible(cols[2] || '')
    if (!industryExpert) continue

    rows.push({
      sNo:           parseInt(cols[0], 10) || null,
      date:          stripInvisible(cols[1] || ''),
      industryExpert,
      designation:   stripInvisible(cols[3] || ''),
      courseName:    stripInvisible(cols[4] || ''),
      driveLink:     stripInvisible(cols[5] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — INDUSTRIAL INVOLVEMENT ====================
function PublishAndImportIndustrialInvolvementCsvAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing document...'})

    setTimeout(async () => {
      try {
        toast.push({status: 'info', title: 'Checking CSV file...'})

        const doc = await client.fetch(
          `*[_type == "industrialInvolvement" && _id == $docId][0]{
            _id,
            csvAssetId,
            dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({
            status: 'success',
            title: 'Published successfully',
            description: 'No CSV file attached — nothing to import.',
          })
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id

        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${doc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Industrial Involvement CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseIndustrialInvolvementCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "industrialInvolvementData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} industrial involvement records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'industrialInvolvementData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo:           row.sNo,
              date:          row.date || undefined,
              industryExpert: row.industryExpert,
              designation:   row.designation || undefined,
              courseName:    row.courseName || undefined,
              driveLink:     row.driveLink || undefined,
            })
          })
          await tx.commit()
        }

        await client
          .patch(docId)
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
        console.error('Industrial Involvement CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Industrial Involvement CSV import failed (document is still published)',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — INDUSTRIAL INVOLVEMENT ====================
function DeleteAndCleanupIndustrialInvolvementAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the Industrial Involvement document AND ALL associated records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up industrial involvement data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "industrialInvolvementData" && parent._ref == $docId]._id',
        {docId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Industrial Involvement document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Industrial Involvement document and all its data.',
      })
    } catch (err) {
      console.error('Industrial Involvement delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated industrial involvement data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CSV PARSING — GUEST LECTURE ====================
// Columns: Sl.No. | Date | Name of the Programme | Name of the speaker, Designation and Address details | Topic | Proof
function parseGuestLectureCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const rows = []

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

    const sNo = parseInt(cols[0], 10) || null
    const speakerDetails = stripInvisible(cols[3] || '')
    if (!speakerDetails) continue // Minimum required

    rows.push({
      sNo,
      date: stripInvisible(cols[1] || ''),
      programmeName: stripInvisible(cols[2] || ''),
      speakerDetails,
      topic: stripInvisible(cols[4] || ''),
      proofLink: stripInvisible(cols[5] || ''),
    })
  }

  return rows
}

// ==================== CUSTOM PUBLISH + IMPORT ACTION — GUEST LECTURE ====================
function PublishAndImportGuestLectureCsvAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing document...'})

    setTimeout(async () => {
      try {
        toast.push({status: 'info', title: 'Checking CSV file...'})

        const doc = await client.fetch(
          `*[_type == "guestLecture" && _id == $docId][0]{
            _id,
            csvAssetId,
            dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {docId}
        )

        if (!doc?.csv?.asset?.url) {
          toast.push({
            status: 'success',
            title: 'Published successfully',
            description: 'No CSV file attached — nothing to import.',
          })
          setIsRunning(false)
          return
        }

        const assetId = doc.csv.asset._id

        if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${doc.dataCount} records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Guest Lecture CSV...'})
        const response = await fetch(doc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseGuestLectureCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "guestLectureData" && parent._ref == $docId]._id',
          {docId}
        )
        if (existingIds.length > 0) {
          const batchSize = 100
          for (let i = 0; i < existingIds.length; i += batchSize) {
            const batch = existingIds.slice(i, i + batchSize)
            const tx = client.transaction()
            batch.forEach((rowId) => tx.delete(rowId))
            await tx.commit()
          }
        }

        toast.push({status: 'info', title: `Creating ${rows.length} records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'guestLectureData',
              parent: {_type: 'reference', _ref: docId, _weak: true},
              sNo:           row.sNo,
              date:          row.date || undefined,
              programmeName: row.programmeName || undefined,
              speakerDetails: row.speakerDetails,
              topic:         row.topic || undefined,
              proofLink:     row.proofLink || undefined,
            })
          })
          await tx.commit()
        }

        await client
          .patch(docId)
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
        console.error('Guest Lecture CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Guest Lecture CSV import failed (document is still published)',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, docId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== CUSTOM DELETE ACTION — GUEST LECTURE ====================
function DeleteAndCleanupGuestLectureAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const docId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete the Guest Lecture document AND ALL associated records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up guest lecture data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "guestLectureData" && parent._ref == $docId]._id',
        {docId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((rowId) => tx.delete(rowId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting Guest Lecture document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted Guest Lecture document and all its data.',
      })
    } catch (err) {
      console.error('Guest Lecture delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated guest lecture data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, docId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '🗑️',
  }
}

// ==================== CEP STRATEGIES — SHARED HELPERS ====================

const stripInvisibleCep = (str) =>
  (str || '').replace(/^[\uFEFF\u200B\u200C\u200D\u00A0\u202F\u2060\u3000]+/, '').trim()

function parseCepCsvLines(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row
  const result = []
  for (const line of lines) {
    if (!line.trim()) continue
    const cols = []
    let cur = ''
    let q = false
    for (const ch of line) {
      if (ch === '"') { q = !q }
      else if (ch === ',' && !q) { cols.push(stripInvisibleCep(cur)); cur = '' }
      else { cur += ch }
    }
    cols.push(stripInvisibleCep(cur))
    result.push(cols)
  }
  return result
}

async function batchDeleteCepDocs(client, ids) {
  const batchSize = 100
  for (let i = 0; i < ids.length; i += batchSize) {
    const tx = client.transaction()
    ids.slice(i, i + batchSize).forEach((id) => tx.delete(id))
    await tx.commit()
  }
}

async function batchCreateCepDocs(client, dataType, rows) {
  const batchSize = 100
  for (let i = 0; i < rows.length; i += batchSize) {
    const tx = client.transaction()
    rows.slice(i, i + batchSize).forEach((row) => {
      const clean = Object.fromEntries(
        Object.entries(row).filter(([, v]) => v !== undefined && v !== null && v !== '')
      )
      tx.create({_type: dataType, ...clean})
    })
    await tx.commit()
  }
}

// Factory — Publish action: publishes the doc then imports the attached CSV into dataType records
function makeCepPublishAction({uploadType, dataType, label, mapRow}) {
  return function CepPublishAction({id, type}) {
    const {publish} = useDocumentOperation(id, type)
    const [isRunning, setIsRunning] = useState(false)
    const client = useClient({apiVersion: '2024-01-30'})
    const toast = useToast()
    const docId = id.replace(/^drafts\./, '')

    const onHandle = useCallback(() => {
      if (publish.disabled || isRunning) return
      publish.execute()
      setIsRunning(true)

      setTimeout(async () => {
        try {
          const doc = await client.fetch(
            `*[_type == $uploadType && _id == $docId][0]{
              _id, csvAssetId, dataCount,
              "csv": csvFile{asset->{_id,url}}
            }`,
            {uploadType, docId}
          )

          if (!doc?.csv?.asset?.url) {
            toast.push({status: 'warning', title: 'No CSV file attached — nothing imported.'})
            setIsRunning(false)
            return
          }

          const assetId = doc.csv.asset._id
          if (doc.csvAssetId === assetId && (doc.dataCount || 0) > 0) {
            toast.push({status: 'info', title: 'CSV unchanged — no re-import needed.'})
            setIsRunning(false)
            return
          }

          toast.push({status: 'info', title: `Importing ${label} CSV...`})

          const response = await fetch(doc.csv.asset.url)
          const csvText = await response.text()
          const allLines = parseCepCsvLines(csvText)

          const rows = allLines
            .map((cols) => mapRow(cols))
            .filter((r) => Object.values(r).filter((v) => v !== undefined && v !== '').length > 1)

          const existingIds = await client.fetch('*[_type == $dataType]._id', {dataType})
          if (existingIds.length > 0) {
            toast.push({status: 'info', title: `Removing ${existingIds.length} old records...`})
            await batchDeleteCepDocs(client, existingIds)
          }

          toast.push({status: 'info', title: `Creating ${rows.length} records...`})
          await batchCreateCepDocs(client, dataType, rows)

          await client.patch(docId).set({
            dataCount: rows.length,
            csvAssetId: assetId,
            csvImportedAt: new Date().toISOString(),
          }).commit()

          toast.push({
            status: 'success',
            title: `✅ Published & imported ${rows.length} ${label} records!`,
            description: 'Data is now live on the frontend.',
          })
        } catch (err) {
          console.error(`${label} CSV import error:`, err)
          toast.push({
            status: 'error',
            title: `${label} CSV import failed (document is still published)`,
            description: err.message,
          })
        } finally {
          setIsRunning(false)
        }
      }, 2000)
    }, [publish, isRunning, client, docId, toast])

    return {
      label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
      disabled: !!publish.disabled || isRunning,
      onHandle,
      tone: 'primary',
      shortcut: 'Ctrl+Alt+P',
    }
  }
}

// Factory — Delete action: deletes all dataType records then deletes the upload doc
function makeCepDeleteAction({dataType, label}) {
  return function CepDeleteAction({id, type}) {
    const {delete: deleteOp} = useDocumentOperation(id, type)
    const [isDeleting, setIsDeleting] = useState(false)
    const client = useClient({apiVersion: '2024-01-30'})
    const toast = useToast()

    const onHandle = useCallback(async () => {
      if (deleteOp.disabled || isDeleting) return
      if (!window.confirm(
        `Are you sure? This will delete this ${label} upload document AND ALL associated data records. This cannot be undone.`
      )) return

      setIsDeleting(true)
      toast.push({status: 'info', title: `Cleaning up ${label} data...`})

      try {
        const existingIds = await client.fetch('*[_type == $dataType]._id', {dataType})
        if (existingIds.length > 0) {
          toast.push({status: 'info', title: `Deleting ${existingIds.length} records...`})
          await batchDeleteCepDocs(client, existingIds)
        }

        toast.push({status: 'info', title: `Deleting ${label} upload document...`})
        deleteOp.execute()

        toast.push({
          status: 'success',
          title: `Successfully deleted ${label} upload document and all its data.`,
        })
      } catch (err) {
        console.error(`${label} delete cleanup error:`, err)
        toast.push({
          status: 'error',
          title: `Failed to delete associated ${label} data`,
          description: err.message,
        })
      } finally {
        setIsDeleting(false)
      }
    }, [deleteOp, isDeleting, client, toast])

    return {
      label: isDeleting ? 'Deleting data...' : 'Delete with all data',
      disabled: !!deleteOp.disabled || isDeleting,
      onHandle,
      tone: 'critical',
      icon: () => '🗑️',
    }
  }
}

// Standard column mapper: S.No | col1 | col2 | Complex Problem | SDGs | Link
const cepStandardMapRow = (col1Field, col2Field) => (c) => ({
  sNo:            parseFloat(c[0]) || undefined,
  [col1Field]:    stripInvisibleCep(c[1]) || undefined,
  [col2Field]:    stripInvisibleCep(c[2]) || undefined,
  complexProblem: stripInvisibleCep(c[3]) || undefined,
  sdg:            stripInvisibleCep(c[4]) || undefined,
  link:           stripInvisibleCep(c[5]) || undefined,
})

// ── Problem-Based Learning ────────────────────────────────────────────────────
const PublishAndImportCepPblAction = makeCepPublishAction({
  uploadType: 'cepUpload_pbl', dataType: 'cepData_pbl', label: 'Problem-Based Learning',
  mapRow: cepStandardMapRow('courseCodeTitle', 'learningActivity'),
})
const DeleteAndCleanupCepPblAction = makeCepDeleteAction({dataType: 'cepData_pbl', label: 'Problem-Based Learning'})

// ── Project-Based Learning ────────────────────────────────────────────────────
const PublishAndImportCepProjblAction = makeCepPublishAction({
  uploadType: 'cepUpload_projbl', dataType: 'cepData_projbl', label: 'Project-Based Learning',
  mapRow: cepStandardMapRow('courseCodeTitle', 'learningActivity'),
})
const DeleteAndCleanupCepProjblAction = makeCepDeleteAction({dataType: 'cepData_projbl', label: 'Project-Based Learning'})

// ── Mini Projects ─────────────────────────────────────────────────────────────
const PublishAndImportCepMiniAction = makeCepPublishAction({
  uploadType: 'cepUpload_mini', dataType: 'cepData_mini', label: 'Mini Projects',
  mapRow: cepStandardMapRow('courseCodeTitle', 'learningActivity'),
})
const DeleteAndCleanupCepMiniAction = makeCepDeleteAction({dataType: 'cepData_mini', label: 'Mini Projects'})

// ── Capstone Projects ─────────────────────────────────────────────────────────
const PublishAndImportCepCapstoneAction = makeCepPublishAction({
  uploadType: 'cepUpload_capstone', dataType: 'cepData_capstone', label: 'Capstone Projects',
  mapRow: cepStandardMapRow('courseCodeTitle', 'learningActivity'),
})
const DeleteAndCleanupCepCapstoneAction = makeCepDeleteAction({dataType: 'cepData_capstone', label: 'Capstone Projects'})

// ── Integrated Design Projects ────────────────────────────────────────────────
const PublishAndImportCepIdpAction = makeCepPublishAction({
  uploadType: 'cepUpload_idp', dataType: 'cepData_idp', label: 'Integrated Design Projects',
  mapRow: cepStandardMapRow('courseCodeTitle', 'learningActivity'),
})
const DeleteAndCleanupCepIdpAction = makeCepDeleteAction({dataType: 'cepData_idp', label: 'Integrated Design Projects'})

// ── Hackathons — S.No | Student Team | Hackathon & Problem Statement | Complex | SDGs | Link ──
const PublishAndImportCepHackathonAction = makeCepPublishAction({
  uploadType: 'cepUpload_hackathon', dataType: 'cepData_hackathon', label: 'Hackathons',
  mapRow: (c) => ({
    sNo:              parseFloat(c[0]) || undefined,
    studentTeam:      stripInvisibleCep(c[1]) || undefined,
    hackathonProblem: stripInvisibleCep(c[2]) || undefined,
    complexProblem:   stripInvisibleCep(c[3]) || undefined,
    sdg:              stripInvisibleCep(c[4]) || undefined,
    link:             stripInvisibleCep(c[5]) || undefined,
  }),
})
const DeleteAndCleanupCepHackathonAction = makeCepDeleteAction({dataType: 'cepData_hackathon', label: 'Hackathons'})

// ── Activity Based Learning — S.No | Organized By | Complex Relevance | SDGs | Link ─────────
const PublishAndImportCepAblAction = makeCepPublishAction({
  uploadType: 'cepUpload_abl', dataType: 'cepData_abl', label: 'Activity Based Learning',
  mapRow: (c) => ({
    sNo:            parseFloat(c[0]) || undefined,
    organizedBy:    stripInvisibleCep(c[1]) || undefined,
    complexProblem: stripInvisibleCep(c[2]) || undefined,
    sdg:            stripInvisibleCep(c[3]) || undefined,
    link:           stripInvisibleCep(c[4]) || undefined,
  }),
})
const DeleteAndCleanupCepAblAction = makeCepDeleteAction({dataType: 'cepData_abl', label: 'Activity Based Learning'})

// ==================== CSV PARSING — INFOSYS SPRINGBOARD ====================
// Expected columns: Register Number | Name | Certificates Drive Link
// Row 0 is the header and is skipped.
function parseInfospringCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').replace(/^\u00EF\u00BB\u00BF/, '')
  const lines = cleanText.split(/\r?\n/)
  lines.shift() // remove header row

  const stripInvisible = (str) =>
    str.replace(/^[\uFEFF\u200B\u200C\u200D\u00A0\u202F\u2060\u3000]+/, '').trim()

  const rows = []
  let sNo = 1

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

    const registerNumber = stripInvisible(cols[0] || '')
    const name = stripInvisible(cols[1] || '')
    if (!name && !registerNumber) continue

    rows.push({
      sNo: sNo++,
      registerNumber,
      name,
      certDriveLink: stripInvisible(cols[2] || '') || undefined,
    })
  }

  return rows
}

// ==================== PUBLISH + IMPORT ACTION — INFOSYS SPRINGBOARD ====================
function PublishAndImportInfospringAction({id, type}) {
  const {publish} = useDocumentOperation(id, type)
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const coordId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)
    toast.push({status: 'info', title: 'Publishing Infosys Springboard document...'})

    setTimeout(async () => {
      try {
        toast.push({status: 'info', title: 'Checking CSV file...'})

        const coordDoc = await client.fetch(
          `*[_type == "infospringCoord" && _id == $coordId][0]{
            _id,
            csvAssetId,
            dataCount,
            "csv": csvFile{asset->{_id, url}}
          }`,
          {coordId}
        )

        if (!coordDoc?.csv?.asset?.url) {
          toast.push({
            status: 'success',
            title: 'Published successfully',
            description: 'No CSV file attached — nothing to import.',
          })
          setIsRunning(false)
          return
        }

        const assetId = coordDoc.csv.asset._id

        if (coordDoc.csvAssetId === assetId && (coordDoc.dataCount || 0) > 0) {
          toast.push({
            status: 'success',
            title: 'Published! CSV already up to date.',
            description: `${coordDoc.dataCount} student records already imported from this file.`,
          })
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: 'Downloading & parsing Infosys Springboard CSV...'})
        const response = await fetch(coordDoc.csv.asset.url)
        if (!response.ok) throw new Error('Failed to download CSV')
        const csvText = await response.text()
        const rows = parseInfospringCsvText(csvText)

        if (rows.length === 0) {
          toast.push({status: 'warning', title: 'Published but CSV has no valid rows'})
          setIsRunning(false)
          return
        }

        toast.push({status: 'info', title: `Found ${rows.length} rows. Deleting old data...`})

        const existingIds = await client.fetch(
          '*[_type == "infospringData" && coordinator._ref == $coordId]._id',
          {coordId}
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

        toast.push({status: 'info', title: `Creating ${rows.length} student records...`})

        const batchSize = 100
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((row) => {
            tx.create({
              _type: 'infospringData',
              coordinator: {_type: 'reference', _ref: coordId, _weak: true},
              sNo: row.sNo,
              registerNumber: row.registerNumber,
              name: row.name,
              certDriveLink: row.certDriveLink,
            })
          })
          await tx.commit()
        }

        await client
          .patch(coordId)
          .set({
            dataCount: rows.length,
            csvAssetId: assetId,
            csvImportedAt: new Date().toISOString(),
          })
          .commit()

        toast.push({
          status: 'success',
          title: `\u2705 Published & imported ${rows.length} student records!`,
          description: 'Data is now live on the frontend.',
        })
      } catch (err) {
        console.error('Infosys Springboard CSV import error:', err)
        toast.push({
          status: 'error',
          title: 'Infosys Springboard CSV import failed (document is still published)',
          description: err.message,
        })
      } finally {
        setIsRunning(false)
      }
    }, 2000)
  }, [publish, isRunning, client, coordId, toast])

  return {
    label: isRunning ? 'Publishing & importing CSV...' : 'Publish',
    disabled: !!publish.disabled || isRunning,
    onHandle,
    tone: 'primary',
    shortcut: 'Ctrl+Alt+P',
  }
}

// ==================== DELETE ACTION — INFOSYS SPRINGBOARD ====================
function DeleteAndCleanupInfospringAction({id, type}) {
  const {delete: deleteOp} = useDocumentOperation(id, type)
  const [isDeleting, setIsDeleting] = useState(false)
  const client = useClient({apiVersion: '2024-01-30'})
  const toast = useToast()

  const coordId = id.replace(/^drafts\./, '')

  const onHandle = useCallback(async () => {
    if (deleteOp.disabled || isDeleting) return

    if (!window.confirm('Are you sure? This will delete this coordinator document AND ALL associated student data records. This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    toast.push({status: 'info', title: 'Cleaning up Infosys Springboard student data...'})

    try {
      const existingIds = await client.fetch(
        '*[_type == "infospringData" && coordinator._ref == $coordId]._id',
        {coordId}
      )

      if (existingIds.length > 0) {
        toast.push({status: 'info', title: `Deleting ${existingIds.length} student records...`})
        const batchSize = 100
        for (let i = 0; i < existingIds.length; i += batchSize) {
          const batch = existingIds.slice(i, i + batchSize)
          const tx = client.transaction()
          batch.forEach((docId) => tx.delete(docId))
          await tx.commit()
        }
      }

      toast.push({status: 'info', title: 'Deleting coordinator document...'})
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Successfully deleted coordinator and all student data.',
      })
    } catch (err) {
      console.error('Infosys Springboard delete cleanup error:', err)
      toast.push({
        status: 'error',
        title: 'Failed to delete associated student data',
        description: err.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, isDeleting, client, coordId, toast])

  return {
    label: isDeleting ? 'Deleting data...' : 'Delete with all data',
    disabled: !!deleteOp.disabled || isDeleting,
    onHandle,
    tone: 'critical',
    icon: () => '\uD83D\uDDD1\uFE0F',
  }
}

