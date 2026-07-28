import {defineField, defineType} from 'sanity'

// ── Individual Journal row ────────────────────────────────────────────────────
export const journalData = defineType({
  name: 'journalData',
  type: 'document',
  title: 'Journal Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'journal'}],
      title: 'Journal Document',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
    }),
    defineField({
      name: 'studentName',
      type: 'string',
      title: 'Name of the student',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'paperTitle',
      type: 'string',
      title: 'Title of the paper',
    }),
    defineField({
      name: 'journalDetails',
      type: 'string',
      title: 'Journal/Conference details',
    }),
    defineField({
      name: 'scopusSci',
      type: 'string',
      title: 'Scopus/SCI',
    }),
    defineField({
      name: 'webLink',
      type: 'url',
      title: 'Web link of the paper',
    }),
    defineField({
      name: 'year',
      type: 'string',
      title: 'Year',
    }),
  ],
  preview: {
    select: {
      title: 'studentName',
      subtitle: 'paperTitle',
    },
  },
})
