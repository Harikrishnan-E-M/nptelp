import {defineField, defineType} from 'sanity'

// ── Individual Mini Project row ───────────────────────────────────────────────
export const miniProjectData = defineType({
  name: 'miniProjectData',
  type: 'document',
  title: 'Mini Project Data',
  fields: [
    defineField({
      name: 'year',
      type: 'reference',
      to: [{type: 'miniProject'}],
      title: 'Mini Project Document',
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
      name: 'miniProjectLink',
      type: 'url',
      title: 'Mini Project Link',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'course',
    },
  },
})
