import {defineField, defineType} from 'sanity'

// ── Journal document (for uploading the CSV) ──────────────────────────────────
export const journal = defineType({
  name: 'journal',
  type: 'document',
  title: 'Journal Upload',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'e.g., Main Journal CSV Upload',
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
        'Upload the Journal CSV (Columns: S.No, Name of the student, Title of the paper, Journal/Conference details, Scopus/SCI, Web link of the paper, year).',
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
      title: 'title',
      subtitle: 'description',
    },
  },
})
