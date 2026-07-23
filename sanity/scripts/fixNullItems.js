/**
 * Removes null/empty items from the draft ICT Tools 2025-2026 EVEN document
 * and discards the broken draft so the user can start fresh from the published version.
 */
import {createClient} from '@sanity/client'

const token = process.env.SANITY_TOKEN
const client = createClient({
  projectId: '1asbko6r',
  dataset: 'production',
  apiVersion: '2024-01-30',
  useCdn: false,
  token,
})

const draftId = 'drafts.e1349e91-dcfe-4abd-bf91-5e87e7bc1181'

async function run() {
  // Fetch full draft
  const doc = await client.fetch(
    `*[_id == $draftId][0]{ _id, sections[]{ _key, sectionTitle, items[]{ _key, name, courseCode } } }`,
    { draftId }
  )

  if (!doc) {
    console.log('Draft not found.')
    return
  }

  console.log('📄 Found draft:', draftId)

  // Find all null/empty items and collect their keys to unset
  const unsetPaths = []
  doc.sections.forEach((sec, si) => {
    if (!sec.items) return
    sec.items.forEach((item, ii) => {
      if (!item.name || item.name === null) {
        console.log(`  ❌ Found null item in Section ${si + 1} ("${sec.sectionTitle}"), item index ${ii + 1} — will remove`)
        unsetPaths.push(`sections[_key=="${sec._key}"].items[_key=="${item._key}"]`)
      }
    })
  })

  if (unsetPaths.length === 0) {
    console.log('✅ No null items found. Draft looks clean.')
    return
  }

  console.log(`\nRemoving ${unsetPaths.length} null/empty item(s)...`)
  await client.patch(draftId).unset(unsetPaths).commit()
  console.log('✅ Null items removed successfully.')
  console.log('\nYou can now open the document in Sanity Studio and Publish it.')
}

run().catch(err => { console.error(err); process.exit(1) })
