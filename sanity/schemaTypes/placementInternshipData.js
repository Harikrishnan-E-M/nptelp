import {defineField, defineType} from 'sanity'

// ── Individual Placement Internship row ───────────────────────────────────────
export const placementInternshipData = defineType({
  name: 'placementInternshipData',
  type: 'document',
  title: 'Placement Internship Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'placementInternship'}],
      title: 'Placement Internship Year',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
    }),
    defineField({
      name: 'rollNumber',
      type: 'string',
      title: 'Roll Number',
    }),
    defineField({
      name: 'studentName',
      type: 'string',
      title: 'Student Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'companyAndLocation',
      type: 'string',
      title: 'Company & Location',
    }),
    defineField({
      name: 'fromDate',
      type: 'string',
      title: 'From Date',
    }),
    defineField({
      name: 'toDate',
      type: 'string',
      title: 'To Date',
    }),
    defineField({
      name: 'duration',
      type: 'string',
      title: 'Duration (Months)',
    }),
    defineField({
      name: 'stipend',
      type: 'string',
      title: 'Stipend',
    }),
    defineField({
      name: 'internshipType',
      type: 'string',
      title: 'Internship Type',
    }),
  ],
  preview: {
    select: {
      title: 'studentName',
      subtitle: 'companyAndLocation',
    },
  },
})
