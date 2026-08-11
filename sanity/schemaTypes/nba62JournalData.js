import {defineField, defineType} from 'sanity'

// ── Individual 6.2 Journal row ────────────────────────────────────────────────
export const nba62JournalData = defineType({
  name: 'nba62JournalData',
  type: 'document',
  title: '6.2 Journal Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'nba62Journal'}],
      title: '6.2 Journal Document',
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
      name: 'coAuthors',
      type: 'string',
      title: 'Co-Authors',
    }),
    defineField({
      name: 'paperTitle',
      type: 'string',
      title: 'Paper Title',
    }),
    defineField({
      name: 'journalName',
      type: 'string',
      title: 'Journal Name',
    }),
    defineField({
      name: 'typeOfJournal',
      type: 'string',
      title: 'Type of Journal (SCI/SCIE/SCOPUS)',
    }),
    defineField({
      name: 'publishedMonthYear',
      type: 'string',
      title: 'Published Month/Year',
    }),
    defineField({
      name: 'volumeNumber',
      type: 'string',
      title: 'Volume Number',
    }),
    defineField({
      name: 'issueNumber',
      type: 'string',
      title: 'Issue Number',
    }),
    defineField({
      name: 'pageNumber',
      type: 'string',
      title: 'Page Number',
    }),
    defineField({
      name: 'doiLink',
      type: 'url',
      title: 'DOI Link',
    }),
    defineField({
      name: 'quartileRank',
      type: 'string',
      title: 'Quartile Rank',
    }),
  ],
  preview: {
    select: {
      title: 'facultyName',
      subtitle: 'paperTitle',
    },
  },
})
