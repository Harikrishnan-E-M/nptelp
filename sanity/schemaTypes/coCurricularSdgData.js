import {defineField, defineType} from 'sanity'

// ── Co-Curricular SDG row (no year grouping — all records in one flat list) ───
export const coCurricularSdgData = defineType({
  name: 'coCurricularSdgData',
  type: 'document',
  title: 'Co-Curricular SDG Data',
  fields: [
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
    }),
    defineField({
      name: 'courseCodeTitle',
      type: 'string',
      title: 'Course Code & Title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'typeOfLearning',
      type: 'string',
      title: 'Type of Learning / Activity',
    }),
    defineField({
      name: 'relevanceToComplex',
      type: 'text',
      title: 'Relevance to Complex Engineering Problems',
      rows: 3,
    }),
    defineField({
      name: 'sdg',
      type: 'string',
      title: 'Sustainable Development Goals',
    }),
    defineField({
      name: 'problemStatement',
      type: 'text',
      title: 'Problem Statement',
      rows: 3,
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
      subtitle: 'typeOfLearning',
    },
  },
})
