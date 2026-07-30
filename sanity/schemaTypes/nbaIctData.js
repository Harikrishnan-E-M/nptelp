import {defineField, defineType} from 'sanity'

export const nbaIctData = defineType({
  name: 'nbaIctData',
  type: 'document',
  title: 'NBA ICT Tools Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'nbaIct'}],
      title: 'NBA ICT Document',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
      description: 'Serial Number',
    }),
    defineField({
      name: 'facultyName',
      type: 'string',
      title: 'Name of the Faculty',
    }),
    defineField({
      name: 'courseName',
      type: 'string',
      title: 'Course Name',
    }),
    defineField({
      name: 'courseLink',
      type: 'url',
      title: 'Course Link',
    }),
  ],
  preview: {
    select: {
      title: 'facultyName',
      subtitle: 'courseName',
    },
  },
})
