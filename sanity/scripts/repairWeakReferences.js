import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_PROJECT_ID || '1asbko6r'
const dataset = process.env.SANITY_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2024-01-30'
const token = process.env.SANITY_TOKEN

if (!token) {
  console.error('Missing SANITY_TOKEN. Set it in your environment before running this script.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

const batchSize = 200

async function fetchBatch(lastId) {
  const query = `*[_type == "nptelData" && defined(year._ref) && _id > $lastId] | order(_id asc)[0...$limit]{
    _id,
    year
  }`
  return client.fetch(query, {lastId, limit: batchSize})
}

async function run() {
  let lastId = ''
  let total = 0
  let updated = 0

  while (true) {
    const docs = await fetchBatch(lastId)
    if (!docs.length) break

    const tx = client.transaction()
    let changed = 0

    for (const doc of docs) {
      lastId = doc._id
      total += 1

      if (!doc.year || doc.year._weak === true) continue

      tx.patch(doc._id, {
        set: {
          year: {
            _type: 'reference',
            _ref: doc.year._ref,
            _weak: true,
          },
        },
      })
      changed += 1
    }

    if (changed > 0) {
      await tx.commit()
      updated += changed
    }
  }

  console.log(`Scanned: ${total}`)
  console.log(`Updated to weak references: ${updated}`)
  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
