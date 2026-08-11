import {defineField, defineType} from 'sanity'

// ── 6.2.3 Faculty Developmental Activities — Upload document (one per year) ───
export const nba623FacultyDev = defineType({
  name: 'nba623FacultyDev',
  type: 'document',
  title: '6.2.3 Faculty Dev. Activities',
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
        'Upload the 6.2.3 CSV (Columns: S.No, Name of The Faculty, Year/Sem, Subject Code, Subject Name, Working models and prototypes developed (Description), Link).',
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
