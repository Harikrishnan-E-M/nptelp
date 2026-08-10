import {defineField, defineType} from 'sanity'

// ── Activity Based Learning row ───────────────────────────────────────────────
// Note: Uses "organizedBy" instead of courseCodeTitle. No learningActivity column.
export const cepData_abl = defineType({
  name: 'cepData_abl',
  type: 'document',
  title: 'CEP Data — Activity Based Learning',
  fields: [
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
    }),
    defineField({
      name: 'organizedBy',
      type: 'string',
      title: 'Organized By',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'complexProblem',
      type: 'text',
      title: 'Complex Engineering Relevance',
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
      title: 'organizedBy',
      subtitle: 'sdg',
    },
  },
})
