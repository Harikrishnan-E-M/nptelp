import {defineField, defineType} from 'sanity'

// ── Infosys Springboard Certification — Year document ─────────────────────────
// One document per academic year. Inside each year, the admin creates multiple
// "coordinator" (infospringCoord) documents, one per course coordinator.
export const infospringYear = defineType({
  name: 'infospringYear',
  type: 'document',
  title: 'Infosys Springboard — Year',
  fields: [
    defineField({
      name: 'yearLabel',
      type: 'string',
      title: 'Academic Year',
      description: 'e.g. 2023-24',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'string',
      title: 'Description',
    }),
  ],
  preview: {
    select: {
      title: 'yearLabel',
      subtitle: 'description',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Untitled Year',
        subtitle: subtitle || 'Infosys Springboard Certification',
      }
    },
  },
})
