import {createClient} from '@sanity/client'

const token = process.env.SANITY_TOKEN
const client = createClient({
  projectId: '1asbko6r',
  dataset: 'production',
  apiVersion: '2024-01-30',
  useCdn: false,
  token,
})

const docId = 'e1349e91-dcfe-4abd-bf91-5e87e7bc1181'
const draftId = `drafts.${docId}`

async function run() {
  const docs = await client.fetch(
    `*[_id in [$docId, $draftId]]{ _id, _type, yearLabel, semester, sections[]{ sectionTitle, items[]{ name, courseCode } } }`,
    { docId, draftId }
  )

  if (docs.length === 0) {
    console.log('No document found with that ID.')
    return
  }

  for (const d of docs) {
    console.log(`\n📄 _id: ${d._id}`)
    console.log(`   Type: ${d._type} | Year: ${d.yearLabel} | Semester: ${d.semester}`)
    if (d.sections) {
      d.sections.forEach((sec, si) => {
        console.log(`   Section ${si + 1}: ${sec.sectionTitle}`)
        if (sec.items) {
          sec.items.forEach((item, ii) => {
            console.log(`     Item ${ii + 1}: ${item.name} (${item.courseCode || 'no code'})`)
          })
        }
      })
    }
  }
}

run().catch(err => { console.error(err); process.exit(1) })
