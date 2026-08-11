import {defineField, defineType} from 'sanity'

// ── Individual 6.2.3 Faculty Developmental Activity row ──────────────────────
export const nba623FacultyDevData = defineType({
  name: 'nba623FacultyDevData',
  type: 'document',
  title: '6.2.3 Faculty Dev. Activities Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'nba623FacultyDev'}],
      title: '6.2.3 Faculty Dev. Document',
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
      title: 'Name of The Faculty',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'yearSem',
      type: 'string',
      title: 'Year / Sem',
    }),
    defineField({
      name: 'subjectCode',
      type: 'string',
      title: 'Subject Code',
    }),
    defineField({
      name: 'subjectName',
      type: 'string',
      title: 'Subject Name',
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Working Models & Prototypes Developed (Description)',
      rows: 3,
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
      subtitle: 'subjectName',
    },
  },
})
