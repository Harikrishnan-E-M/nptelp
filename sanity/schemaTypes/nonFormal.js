import {defineField, defineType} from 'sanity'

// ── Non Formal document ───────────────────────────────────────────────────────
export const nonFormal = defineType({
  name: 'nonFormal',
  type: 'document',
  title: 'Non Formal',
  fields: [
    defineField({
      name: 'yearLabel',
      type: 'string',
      title: 'Year',
      description: 'e.g., 2024-28',
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
        'Upload the Non Formal CSV (columns: s.no, Student Name, Roll Number, Section, Number of Non formal Course Completed, Course Name 1, Proof 1, Course Name 2, Proof 2).',
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
