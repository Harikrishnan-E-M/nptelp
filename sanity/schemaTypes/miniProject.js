import {defineField, defineType} from 'sanity'

// ── Mini Project document ─────────────────────────────────────────────────────
export const miniProject = defineType({
  name: 'miniProject',
  type: 'document',
  title: 'Mini Project',
  fields: [
    defineField({
      name: 'yearLabel',
      type: 'string',
      title: 'Year',
      description: 'e.g., 2022-23',
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
      description: 'Upload the Mini Project CSV file (columns: S.No, Name, Course, Mini Project link).',
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
