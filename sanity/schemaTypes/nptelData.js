import {defineField, defineType} from 'sanity'

export const nptelData = defineType({
  name: 'nptelData',
  type: 'document',
  title: 'NPTEL Data',
  fields: [
    defineField({
      name: 'year',
      type: 'reference',
      to: [{ type: 'academicYear' }],
      title: 'Academic Year',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'batch',
      type: 'string',
      title: 'Batch',
    }),
    defineField({
      name: 'regNo',
      type: 'string',
      title: 'Registration Number',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'Student Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'semester',
      type: 'string',
      title: 'Semester',
    }),
    defineField({
      name: 'courseCode',
      type: 'string',
      title: 'Course Code',
    }),
    defineField({
      name: 'courseTitle',
      type: 'string',
      title: 'Course Title',
    }),
    defineField({
      name: 'credit',
      type: 'string',
      title: 'Credit',
    }),
    defineField({
      name: 'score',
      type: 'string',
      title: 'Score',
    }),
    defineField({
      name: 'examMonth',
      type: 'string',
      title: 'Exam Month',
    }),
    defineField({
      name: 'examYear',
      type: 'string',
      title: 'Exam Year',
    }),
    defineField({
      name: 'certId',
      type: 'string',
      title: 'Certificate ID',
    }),
    defineField({
      name: 'proofUrl',
      type: 'url',
      title: 'Proof URL',
    }),
    defineField({
      name: 'status',
      type: 'string',
      title: 'Status',
      options: {
        list: [
          { title: 'Accepted', value: 'Accepted' },
          { title: 'Rejected', value: 'Rejected' },
          { title: 'Pending', value: 'Pending' },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'regNo',
    },
  },
})
