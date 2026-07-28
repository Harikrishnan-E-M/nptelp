import {defineField, defineType} from 'sanity'

// ── Scopus year document ───────────────────────────────────────────────────────
export const scopus = defineType({
  name: 'scopus',
  type: 'document',
  title: 'Scopus / Conference Upload',
  fields: [
    defineField({
      name: 'yearLabel',
      type: 'string',
      title: 'Year / Label',
      description: 'e.g., 2025-26',
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
        'Upload the Scopus CSV (Columns: SI.No, Title of the paper, Name of the Conference/Venue, International/National, Date, Authors, Indexed, Name of the Publisher, Website link).',
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
