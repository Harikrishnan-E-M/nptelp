import {defineField, defineType} from 'sanity'

// ── Freelancing Internship year document ──────────────────────────────────────
export const freelancingInternship = defineType({
  name: 'freelancingInternship',
  type: 'document',
  title: 'Freelancing Internship',
  fields: [
    defineField({
      name: 'yearLabel',
      type: 'string',
      title: 'Year / Label',
      description: 'e.g., 24-25',
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
        'Upload the Freelancing Internship CSV (Columns: Sno, Roll No., Name, Year, Section, Start Date, End Date, Total Duration, Company Detail, Intern Offer Letter, Completion link).',
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
