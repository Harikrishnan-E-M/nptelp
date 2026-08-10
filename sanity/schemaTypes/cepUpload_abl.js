import {defineField, defineType} from 'sanity'

// ── Activity Based Learning — CSV upload document ─────────────────────────────
// Columns: S.No, Organized By, Complex Engineering Relevance, SDGs Mapped, Link
export const cepUpload_abl = defineType({
  name: 'cepUpload_abl',
  type: 'document',
  title: 'CEP Upload — Activity Based Learning',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'e.g., Activity Based Learning CSV',
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
        'Expected columns: S.No, Organized By, Complex Engineering Relevance, SDGs Mapped, Link',
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
