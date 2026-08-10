import {defineField, defineType} from 'sanity'

// ── Hackathons — CSV upload document ──────────────────────────────────────────
// Columns: S.No, Student Team, Hackathon and Problem Statement,
//          Complex Engineering Problem Addressed, SDGs Mapped, Link
export const cepUpload_hackathon = defineType({
  name: 'cepUpload_hackathon',
  type: 'document',
  title: 'CEP Upload — Hackathons',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'e.g., Hackathons CSV',
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
        'Expected columns: S.No, Student Team, Hackathon and Problem Statement, Complex Engineering Problem Addressed, SDGs Mapped, Link',
      options: {accept: '.csv'},
    }),
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
