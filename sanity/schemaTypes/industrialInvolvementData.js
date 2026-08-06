import {defineField, defineType} from 'sanity'

// ── Individual Industrial Involvement row ─────────────────────────────────────
export const industrialInvolvementData = defineType({
  name: 'industrialInvolvementData',
  type: 'document',
  title: 'Industrial Involvement Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'industrialInvolvement'}],
      title: 'Industrial Involvement Document',
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
      name: 'date',
      type: 'string',
      title: 'Date',
    }),
    defineField({
      name: 'industryExpert',
      type: 'string',
      title: 'Industry Expert',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'designation',
      type: 'string',
      title: 'Designation',
    }),
    defineField({
      name: 'courseName',
      type: 'string',
      title: 'Course Name',
    }),
    defineField({
      name: 'driveLink',
      type: 'url',
      title: 'Link',
    }),
  ],
  preview: {
    select: {
      title: 'industryExpert',
      subtitle: 'courseName',
    },
  },
})
