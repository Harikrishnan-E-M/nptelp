import {defineField, defineType} from 'sanity'

// ── Individual Guest Lecture row ─────────────────────────────────────
export const guestLectureData = defineType({
  name: 'guestLectureData',
  type: 'document',
  title: 'Guest Lecture Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'guestLecture'}],
      title: 'Guest Lecture Document',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'Sl.No.',
      description: 'Serial Number',
    }),
    defineField({
      name: 'date',
      type: 'string',
      title: 'Date',
    }),
    defineField({
      name: 'programmeName',
      type: 'string',
      title: 'Name of the Programme',
    }),
    defineField({
      name: 'speakerDetails',
      type: 'string',
      title: 'Name of the speaker, Designation and Address details',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'topic',
      type: 'string',
      title: 'Topic',
    }),
    defineField({
      name: 'proofLink',
      type: 'url',
      title: 'Proof',
    }),
  ],
  preview: {
    select: {
      title: 'programmeName',
      subtitle: 'speakerDetails',
    },
  },
})
