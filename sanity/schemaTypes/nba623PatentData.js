import {defineField, defineType} from 'sanity'

// ── Individual 6.2.3 Patent row ───────────────────────────────────────────────
export const nba623PatentData = defineType({
  name: 'nba623PatentData',
  type: 'document',
  title: '6.2.3 Patent Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'nba623Patent'}],
      title: '6.2.3 Patent Document',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
    }),
    defineField({
      name: 'dept',
      type: 'string',
      title: 'Dept',
    }),
    defineField({
      name: 'titleOfInvention',
      type: 'string',
      title: 'Title of Invention',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'patentApplicationNumber',
      type: 'string',
      title: 'Patent Application Number',
    }),
    defineField({
      name: 'status',
      type: 'string',
      title: 'Status',
    }),
    defineField({
      name: 'inventors',
      type: 'text',
      title: 'Name of the Inventors / Department (KEC Alone)',
      rows: 2,
    }),
    defineField({
      name: 'link',
      type: 'url',
      title: 'Link',
    }),
  ],
  preview: {
    select: {
      title: 'titleOfInvention',
      subtitle: 'patentApplicationNumber',
    },
  },
})
