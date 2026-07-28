import { createClient } from '@sanity/client';

const client = createClient({
  projectId: '1asbko6r',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-30',
});

async function check() {
  const data = await client.fetch('*[_type == "caseStudyData"][0...5]{_id, parent}');
  console.log("Sample Case Study Data:", JSON.stringify(data, null, 2));

  const parentDocs = await client.fetch('*[_type == "caseStudy"]{_id, yearLabel}');
  console.log("Parent Docs:", JSON.stringify(parentDocs, null, 2));
}

check().catch(console.error);
