import {defineField, defineType} from 'sanity'

// ── Individual Seminar row ────────────────────────────────────────────────────
export const seminarData = defineType({
  name: 'seminarData',
  type: 'document',
  title: 'Seminar Data',
  fields: [
    defineField({
      name: 'year',
      type: 'reference',
      to: [{type: 'seminar'}],
      title: 'Seminar Year',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
    }),
    defineField({
      name: 'course',
      type: 'string',
      title: 'Course',
    }),
    defineField({
      name: 'facultyName',
      type: 'string',
      title: 'Name of the Faculty',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'driveLink',
      type: 'url',
      title: 'Drive Link',
    }),
  ],
  preview: {
    select: {
      title: 'facultyName',
      subtitle: 'course',
    },
  },
})
