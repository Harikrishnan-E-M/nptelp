/**
 * Migration: proof (string URL) → proofs (array of {label, url})
 *
 * Affects: ictTools, innovativeTeaching
 *
 * Run with:
 *   SANITY_TOKEN=<token> node scripts/migrateProofToProofs.js
 */

import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_PROJECT_ID || '1asbko6r'
const dataset   = process.env.SANITY_DATASET    || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2024-01-30'
const token     = process.env.SANITY_TOKEN

if (!token) {
  console.error('❌  Missing SANITY_TOKEN. Set it in your environment before running this script.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, useCdn: false, token })

const DOC_TYPES = ['ictTools', 'innovativeTeaching']

async function fetchAll(docType) {
  return client.fetch(
    `*[_type == $docType]{
      _id,
      sections[]{
        sectionTitle,
        items[]{
          ...,
          proof,
          proofs
        }
      }
    }`,
    { docType }
  )
}

async function migrate() {
  let totalDocs = 0
  let totalPatched = 0

  for (const docType of DOC_TYPES) {
    console.log(`\n📂 Processing: ${docType}`)
    const docs = await fetchAll(docType)
    console.log(`   Found ${docs.length} document(s)`)

    for (const doc of docs) {
      totalDocs++
      const sections = doc.sections || []
      let needsPatch = false

      // Build patch sets/unsets
      const setOps  = {}
      const unsetOps = []

      sections.forEach((section, sIdx) => {
        const items = section.items || []
        items.forEach((item, iIdx) => {
          const hasOldProof  = typeof item.proof === 'string' && item.proof.trim() !== ''
          const hasNewProofs = Array.isArray(item.proofs) && item.proofs.length > 0

          if (hasOldProof) {
            if (!hasNewProofs) {
              // Migrate: create proofs array from old proof value
              setOps[`sections[${sIdx}].items[${iIdx}].proofs`] = [
                {
                  _key: `migrated_${sIdx}_${iIdx}`,
                  _type: 'proofItem',
                  label: 'Proof 1',
                  url: item.proof.trim(),
                }
              ]
            }
            // Always unset the old proof field
            unsetOps.push(`sections[${sIdx}].items[${iIdx}].proof`)
            needsPatch = true
          }
        })
      })

      if (!needsPatch) {
        console.log(`   ✔ ${doc._id} — no old proof fields, skipping`)
        continue
      }

      try {
        let patch = client.patch(doc._id)
        if (Object.keys(setOps).length > 0) patch = patch.set(setOps)
        if (unsetOps.length > 0)            patch = patch.unset(unsetOps)
        await patch.commit({ autoGenerateArrayKeys: true })

        totalPatched++
        console.log(`   ✅ Patched ${doc._id}`)
        if (Object.keys(setOps).length > 0) {
          console.log(`      → Migrated ${Object.keys(setOps).length} proof(s) to proofs[]`)
        }
        console.log(`      → Unset ${unsetOps.length} old proof field(s)`)
      } catch (err) {
        console.error(`   ❌ Failed to patch ${doc._id}:`, err.message)
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Total documents scanned : ${totalDocs}`)
  console.log(`Total documents patched : ${totalPatched}`)
  console.log(`Migration complete ✅`)
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
