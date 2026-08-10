import {defineField, defineType} from 'sanity'

// ── Mini Projects — CSV upload document ───────────────────────────────────────
export const cepUpload_mini = defineType({
  name: 'cepUpload_mini',
  type: 'document',
  title: 'CEP Upload — Mini Projects',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'e.g., Mini Projects CSV',
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
