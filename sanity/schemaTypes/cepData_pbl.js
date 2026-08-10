import {defineField, defineType} from 'sanity'

// ── Problem-Based Learning row ─────────────────────────────────────────────────
export const cepData_pbl = defineType({
  name: 'cepData_pbl',
  type: 'document',
  title: 'CEP Data — Problem-Based Learning',
  fields: [
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
    }),
    defineField({
      name: 'courseCodeTitle',
      type: 'string',
      title: 'Course Code and Title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'learningActivity',
      type: 'string',
      title: 'Learning Activity',
    }),
    defineField({
      name: 'complexProblem',
      type: 'text',
      title: 'Complex Engineering Problem Addressed',
      rows: 3,
    }),
    defineField({
      name: 'sdg',
      type: 'text',
      title: 'SDGs Mapped',
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
      title: 'courseCodeTitle',
      subtitle: 'learningActivity',
    },
  },
})
