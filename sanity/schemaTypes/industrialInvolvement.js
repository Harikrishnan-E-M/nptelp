import {defineField, defineType} from 'sanity'

// ── Industrial Involvement parent document ────────────────────────────────────
export const industrialInvolvement = defineType({
  name: 'industrialInvolvement',
  type: 'document',
  title: 'Industrial Involvement',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'e.g., Industrial Involvement in Partial Delivery of Regular Courses',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'string',
      title: 'Description',
    }),
    // ── Year-wise summary table (manually entered) ───────────────────────────
    defineField({
      name: 'yearSummary',
      type: 'array',
      title: 'Year-wise Summary',
      description: 'Add year and count entries to display the summary table above the data table.',
      of: [
        {
          type: 'object',
          title: 'Year Entry',
          fields: [
            defineField({
              name: 'year',
              type: 'string',
              title: 'Year',
              description: 'e.g., 2022-23',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'count',
              type: 'number',
              title: 'Count',
              validation: (Rule) => Rule.required().min(0),
            }),
          ],
          preview: {
            select: {title: 'year', subtitle: 'count'},
            prepare({title, subtitle}) {
              return {title: title || 'Year', subtitle: `Count: ${subtitle ?? '—'}`}
            },
          },
        },
      ],
    }),
    defineField({
      name: 'csvFile',
      type: 'file',
      title: 'CSV File',
      description:
        'Upload the Industrial Involvement CSV (Columns: S.No, Date, Industry Expert, Designation, Course Name, Link).',
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
