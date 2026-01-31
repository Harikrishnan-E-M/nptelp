import sanityClient from '@sanity/client'

const client = sanityClient({
  projectId: '1asbko6r',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
  apiVersion: '2024-01-01',
})

async function deleteAllNptelData() {
  try {
    // Find all nptelData documents
    const query = `*[_type == 'nptelData'] {_id}`
    const docs = await client.fetch(query)
    
    console.log(`Found ${docs.length} NPTEL Data documents to delete...`)
    
    if (docs.length === 0) {
      console.log('No documents to delete')
      return
    }
    
    // Delete in batches of 100
    const batchSize = 100
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize)
      const deleteOps = batch.map(doc => ({ delete: { id: doc._id } }))
      
      try {
        await client.transaction().delete(...batch.map(d => d._id)).commit()
        console.log(`Deleted ${batch.length} documents (${i + batch.length}/${docs.length})`)
      } catch (err) {
        console.error(`Failed to delete batch:`, err.message)
      }
    }
    
    console.log(`✓ Successfully deleted all ${docs.length} NPTEL Data documents`)
  } catch (err) {
    console.error('Error:', err.message)
  }
}

deleteAllNptelData()
