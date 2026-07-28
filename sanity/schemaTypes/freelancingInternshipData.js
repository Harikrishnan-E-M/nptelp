import {defineField, defineType} from 'sanity'

// ── Individual Freelancing Internship row ─────────────────────────────────────
export const freelancingInternshipData = defineType({
  name: 'freelancingInternshipData',
  type: 'document',
  title: 'Freelancing Internship Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'freelancingInternship'}],
      title: 'Freelancing Internship Year',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'Sno',
    }),
    defineField({
      name: 'rollNo',
      type: 'string',
      title: 'Roll No.',
    }),
    defineField({
      name: 'studentName',
      type: 'string',
      title: 'Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      type: 'string',
      title: 'Year',
    }),
    defineField({
      name: 'section',
      type: 'string',
      title: 'Section',
    }),
    defineField({
      name: 'startDate',
      type: 'string',
      title: 'Start Date',
    }),
    defineField({
      name: 'endDate',
      type: 'string',
      title: 'End Date',
    }),
    defineField({
      name: 'totalDuration',
      type: 'string',
      title: 'Total Duration',
    }),
    defineField({
      name: 'companyDetail',
      type: 'string',
      title: 'Company Detail',
    }),
    defineField({
      name: 'offerLetterLink',
      type: 'url',
      title: 'Intern Offer Letter (Link)',
    }),
    defineField({
      name: 'completionLink',
      type: 'url',
      title: 'Completion Link',
    }),
  ],
  preview: {
    select: {
      title: 'studentName',
      subtitle: 'companyDetail',
    },
  },
})
