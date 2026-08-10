import {defineField, defineType} from 'sanity'

// ── Problem-Based Learning — CSV upload document ──────────────────────────────
// Upload a CSV here; columns: S.No, Course Code and Title, Learning Activity,
// Complex Engineering Problem Addressed, SDGs Mapped, Link
export const cepUpload_pbl = defineType({
  name: 'cepUpload_pbl',
  type: 'document',
  title: 'CEP Upload — Problem-Based Learning',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'e.g., Problem-Based Learning CSV',
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
        'Expected columns: S.No, Course Code and Title, Learning Activity, Complex Engineering Problem Addressed, SDGs Mapped, Link',
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
