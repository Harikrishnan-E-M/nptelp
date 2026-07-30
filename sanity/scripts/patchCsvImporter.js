const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'plugins', 'csvImporter.js');
let content = fs.readFileSync(filePath, 'utf8');

const newCode = `
// ==================== CSV PARSING — NBA ICT ====================
function parseNbaIctCsvText(csvText) {
  const cleanText = csvText.replace(/^\\uFEFF/, '').replace(/^\\u00EF\\u00BB\\u00BF/, '')
  const lines = cleanText.split(/\\r?\\n/)
  lines.shift() // remove header row
  const rows = []

  const stripInvisible = (str) =>
    str.replace(/^[\\uFEFF\\u200B\\u200C\\u200D\\u00A0\\u202F\\u2060\\u3000]+/, '').trim()

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

  const docId = id.replace(/^drafts\\./, '')

  const onHandle = useCallback(() => {
    if (publish.disabled || isRunning) return

    publish.execute()
    setIsRunning(true)

    setTimeout(async () => {
      try {
        const docQuery = \`*[_type == "nbaIct" && _id == $docId][0]{
          _id,
          title,
          "csv": csvFile { asset->{_id, url} },
          csvAssetId,
          dataCount
        }\`
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
            description: \`\${doc.dataCount} records already imported from this file.\`,
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

        toast.push({status: 'info', title: \`Found \${rows.length} rows. Deleting old data...\`})

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

        toast.push({status: 'info', title: \`Creating \${rows.length} NBA ICT records...\`})

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
          description: \`Successfully imported \${rows.length} NBA ICT records.\`,
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

  const docId = id.replace(/^drafts\\./, '')

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
        toast.push({status: 'info', title: \`Deleting \${existingIds.length} NBA ICT records...\`})
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
`;

// Insert the newCode just before the PLUGIN section
content = content.replace('// ==================== PLUGIN ====================', newCode + '\\n// ==================== PLUGIN ====================');

// Add nbaIct to the plugin actions list
const pluginActionRegex = "if (context.schemaType === 'placementInternship') {\\n        return prev.map((action) => {\\n          if (action.action === 'publish') return PublishAndImportPlacementCsvAction\\n          if (action.action === 'delete') return DeleteAndCleanupPlacementAction\\n          return action\\n        })\\n      }";
const nbaIctAction = \`
      // NBA ICT — custom publish (CSV import) + cleanup delete
      if (context.schemaType === 'nbaIct') {
        return prev.map((action) => {
          if (action.action === 'publish') return PublishAndImportNbaIctCsvAction
          if (action.action === 'delete') return DeleteAndCleanupNbaIctAction
          return action
        })
      }\`;

content = content.replace(pluginActionRegex, '$1\\n' + nbaIctAction);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched csvImporter.js');
