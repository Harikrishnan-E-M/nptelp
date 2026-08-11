import {defineField, defineType} from 'sanity'

// ── Individual 6.2 Conference row ─────────────────────────────────────────────
export const nba62ConferenceData = defineType({
  name: 'nba62ConferenceData',
  type: 'document',
  title: '6.2 Conference Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'nba62Conference'}],
      title: '6.2 Conference Document',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
    }),
    defineField({
      name: 'facultyName',
      type: 'string',
      title: 'Faculty Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'authors',
      type: 'string',
      title: 'Authors',
    }),
    defineField({
      name: 'paperTitle',
      type: 'string',
      title: 'Paper Title',
    }),
    defineField({
      name: 'conferenceName',
      type: 'string',
      title: 'Conference Name',
    }),
    defineField({
      name: 'venue',
      type: 'string',
      title: 'Venue',
    }),
    defineField({
      name: 'publishedMonthYear',
      type: 'string',
      title: 'Published Month/Year',
    }),
    defineField({
      name: 'link',
      type: 'url',
      title: 'Link',
    }),
  ],
  preview: {
    select: {
      title: 'facultyName',
      subtitle: 'paperTitle',
    },
  },
})
