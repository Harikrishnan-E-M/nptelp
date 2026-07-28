import {defineField, defineType} from 'sanity'

// ── Individual Scopus / Conference row ────────────────────────────────────────
export const scopusData = defineType({
  name: 'scopusData',
  type: 'document',
  title: 'Scopus Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'scopus'}],
      title: 'Scopus Year Document',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'SI.No',
    }),
    defineField({
      name: 'paperTitle',
      type: 'string',
      title: 'Title of the paper',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'conferenceName',
      type: 'string',
      title: 'Name of the Conference / Venue',
    }),
    defineField({
      name: 'intlNational',
      type: 'string',
      title: 'International / National',
    }),
    defineField({
      name: 'date',
      type: 'string',
      title: 'Date',
    }),
    defineField({
      name: 'authors',
      type: 'string',
      title: 'Authors (Including Co-authors)',
    }),
    defineField({
      name: 'indexed',
      type: 'string',
      title: 'Indexed (e.g., Scopus, IEEE)',
    }),
    defineField({
      name: 'publisher',
      type: 'string',
      title: 'Name of the Publisher',
    }),
    defineField({
      name: 'webLink',
      type: 'url',
      title: 'Website link',
    }),
  ],
  preview: {
    select: {
      title: 'paperTitle',
      subtitle: 'authors',
    },
  },
})
