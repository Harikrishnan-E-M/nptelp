import {defineField, defineType} from 'sanity'

// ── Individual 6.2 Book row ───────────────────────────────────────────────────
export const nba62BookData = defineType({
  name: 'nba62BookData',
  type: 'document',
  title: '6.2 Book Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'nba62Book'}],
      title: '6.2 Book Document',
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
      name: 'bookTitle',
      type: 'string',
      title: 'Title of the Book / Book Chapter',
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
