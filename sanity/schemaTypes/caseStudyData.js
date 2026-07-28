import {defineField, defineType} from 'sanity'

// ── Individual Case Study row ─────────────────────────────────────────────────
export const caseStudyData = defineType({
  name: 'caseStudyData',
  type: 'document',
  title: 'Case Study Data',
  fields: [
    defineField({
      name: 'year',
      type: 'reference',
      to: [{type: 'caseStudy'}],
      title: 'Case Study Year',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'course',
      type: 'string',
      title: 'Course',
    }),
    defineField({
      name: 'caseStudyLink',
      type: 'url',
      title: 'Case Study Link',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'course',
    },
  },
})
