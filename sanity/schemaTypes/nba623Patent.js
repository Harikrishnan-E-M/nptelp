import {defineField, defineType} from 'sanity'

// ── 6.2.3 Patent — single upload document (no year-wise) ──────────────────────
export const nba623Patent = defineType({
  name: 'nba623Patent',
  type: 'document',
  title: '6.2.3 Faculty Dev. — Patent',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'e.g., Faculty Patent Records',
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
        'Upload the Patent CSV (Columns: S.No, Dept, Title of Invention, Patent Application Number, Status, Name of the Inventors / Department (KEC Alone), Link).',
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
