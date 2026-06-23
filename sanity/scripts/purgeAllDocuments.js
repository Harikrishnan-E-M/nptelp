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

async function run() {
  const query = '*[_type != "system"]'
  const result = await client.delete({query})
  console.log('Delete result:', result)
  console.log('All non-system documents deleted.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
