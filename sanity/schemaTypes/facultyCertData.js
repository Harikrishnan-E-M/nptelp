import {defineField, defineType} from 'sanity'

export const facultyCertData = defineType({
  name: 'facultyCertData',
  type: 'document',
  title: 'Faculty Certification Data',
  fields: [
    defineField({
      name: 'year',
      type: 'reference',
      to: [{type: 'facultyCertification'}],
      title: 'Certification Year',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'Faculty Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'courseName',
      type: 'string',
      title: 'Name of Course Passed',
    }),
    defineField({
      name: 'agency',
      type: 'string',
      title: 'Course Offered By (Agency)',
      description: 'e.g. Swayam, Coursera, NPTEL',
    }),
    defineField({
      name: 'grade',
      type: 'string',
      title: 'Grade Obtained',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'courseName',
    },
  },
})
