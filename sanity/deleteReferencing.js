import { default as sanity } from '@sanity/client'

const client = sanity({
  projectId: '1asbko6r',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2024-01-01',
})

const academicYearId = 'a3139315-1fa6-43e7-be59-9c7092b1fc94'

async function deleteReferencingDocuments() {
  try {
    // Find all documents referencing this academic year
    const query = `*[references("${academicYearId}")] {_id}`
    const docs = await client.fetch(query)
    
    console.log(`Found ${docs.length} documents referencing this academic year`)
    
    // Delete each document
    for (const doc of docs) {
      try {
        await client.delete(doc._id)
        console.log(`Deleted: ${doc._id}`)
      } catch (err) {
        console.error(`Failed to delete ${doc._id}:`, err.message)
      }
    }
    
    // Now try to delete the academic year
    try {
      await client.delete(academicYearId)
      console.log(`Successfully deleted academic year: ${academicYearId}`)
    } catch (err) {
      console.error(`Failed to delete academic year:`, err.message)
    }
  } catch (err) {
    console.error('Error:', err.message)
  }
}

deleteReferencingDocuments()
