import {defineField, defineType} from 'sanity'

// ── Hackathons row ─────────────────────────────────────────────────────────────
// Note: Uses "studentTeam" and "hackathonProblem" instead of the standard column names.
export const cepData_hackathon = defineType({
  name: 'cepData_hackathon',
  type: 'document',
  title: 'CEP Data — Hackathons',
  fields: [
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
    }),
    defineField({
      name: 'studentTeam',
      type: 'text',
      title: 'Student Team',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hackathonProblem',
      type: 'string',
      title: 'Hackathon and Problem Statement',
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
      title: 'studentTeam',
      subtitle: 'hackathonProblem',
    },
  },
})
