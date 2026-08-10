import {defineField, defineType} from 'sanity'

// ── Capstone Projects — CSV upload document ───────────────────────────────────
export const cepUpload_capstone = defineType({
  name: 'cepUpload_capstone',
  type: 'document',
  title: 'CEP Upload — Capstone Projects',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'e.g., Capstone Projects CSV',
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
