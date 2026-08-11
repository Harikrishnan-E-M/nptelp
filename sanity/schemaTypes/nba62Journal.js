import {defineField, defineType} from 'sanity'

// ── 6.2 Journal Upload document ───────────────────────────────────────────────
export const nba62Journal = defineType({
  name: 'nba62Journal',
  type: 'document',
  title: '6.2 Journal',
  fields: [
    defineField({
      name: 'yearLabel',
      type: 'string',
      title: 'Year / Label',
      description: 'e.g., 2024-2025',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'string',
      title: 'Description',
    }),
    defineField({
      name: 'csvFile',
      type: 'file',
      title: 'CSV File',
      description:
        'Upload the 6.2 Journal CSV (Columns: S.No, Faculty Name, Co-Authors, Paper Title, Journal Name, Type of Journal (SCI/SCIE/SCOPUS), Published Month/Year, Volume Number, Issue Number, Page Number, DOI Link, Quartile Rank).',
      options: {accept: '.csv'},
    }),
    // ── Tracking fields (auto-filled on import) ──────────────────────────────
    defineField({
      name: 'dataCount',
      type: 'number',
      title: 'Record Count',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'csvAssetId',
      type: 'string',
      title: 'CSV Asset ID',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'csvImportedAt',
      type: 'datetime',
      title: 'CSV Imported At',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'yearLabel',
      subtitle: 'description',
    },
  },
})
