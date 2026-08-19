import {defineField, defineType} from 'sanity'

// ── Infosys Springboard — Student row ─────────────────────────────────────────
// One document per student, linked to an infospringCoord document.
// Populated automatically when the coordinator's CSV is published.
export const infospringData = defineType({
  name: 'infospringData',
  type: 'document',
  title: 'Infosys Springboard — Student Data',
  fields: [
    defineField({
      name: 'coordinator',
      type: 'reference',
      to: [{type: 'infospringCoord'}],
      title: 'Course Coordinator',
      weak: true,
    }),
    defineField({
      name: 'sNo',
      type: 'number',
      title: 'S.No',
    }),
    defineField({
      name: 'registerNumber',
      type: 'string',
      title: 'Register Number',
    }),
    defineField({
      name: 'name',
      type: 'string',
      title: 'Student Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'certDriveLink',
      type: 'url',
      title: 'Certificates Drive Link',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'registerNumber',
    },
  },
})
