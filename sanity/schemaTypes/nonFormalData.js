import {defineField, defineType} from 'sanity'

// ── Individual Non Formal row ─────────────────────────────────────────────────
export const nonFormalData = defineType({
  name: 'nonFormalData',
  type: 'document',
  title: 'Non Formal Data',
  fields: [
    defineField({
      name: 'parent',
      type: 'reference',
      to: [{type: 'nonFormal'}],
      title: 'Non Formal Document',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    defineField({
      name: 'studentName',
      type: 'string',
      title: 'Student Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rollNumber',
      type: 'string',
      title: 'Roll Number',
    }),
    defineField({
      name: 'section',
      type: 'string',
      title: 'Section',
    }),
    defineField({
      name: 'nonFormalCourseCount',
      type: 'number',
      title: 'Number of Non Formal Course Completed',
    }),
    defineField({
      name: 'courseName1',
      type: 'string',
      title: 'Course Name 1',
    }),
    defineField({
      name: 'proof1',
      type: 'url',
      title: 'Proof (Course 1)',
    }),
    defineField({
      name: 'courseName2',
      type: 'string',
      title: 'Course Name 2',
    }),
    defineField({
      name: 'proof2',
      type: 'url',
      title: 'Proof2 (Course 2)',
    }),
  ],
  preview: {
    select: {
      title: 'studentName',
      subtitle: 'rollNumber',
    },
  },
})
