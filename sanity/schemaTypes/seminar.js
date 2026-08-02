import {defineField, defineType} from 'sanity'

// ── Seminar parent document ───────────────────────────────────────────────────
export const seminar = defineType({
  name: 'seminar',
  type: 'document',
  title: 'Seminar',
  fields: [
    defineField({
      name: 'yearLabel',
      type: 'string',
      title: 'Year',
      description: 'e.g., 2024-25',
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
      description: 'Upload the Seminar CSV file (columns: S.No, Course, Name of the Faculty, Drive Link).',
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
