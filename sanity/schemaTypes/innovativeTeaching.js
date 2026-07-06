import {defineField, defineType} from 'sanity'

export const innovativeTeaching = defineType({
  name: 'innovativeTeaching',
  type: 'document',
  title: 'Innovative Teaching Activity',
  fields: [
    defineField({
      name: 'yearLabel',
      type: 'string',
      title: 'Year Label',
      description: 'e.g. 2023-24',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'semester',
      type: 'string',
      title: 'Semester',
      description: 'ODD or EVEN semester',
      options: {
        list: [
          {title: 'ODD Semester', value: 'ODD'},
          {title: 'EVEN Semester', value: 'EVEN'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'pageTitle',
      type: 'string',
      title: 'Page Title',
      description: 'Title displayed on the frontend page for this entry',
    }),
    defineField({
      name: 'sections',
      type: 'array',
      title: 'Sections',
      description: 'Add up to 4 sections. Each section contains a list of Innovative Teaching entries.',
      of: [
        {
          type: 'object',
          name: 'section',
          title: 'Section',
          fields: [
            defineField({
              name: 'sectionTitle',
              type: 'string',
              title: 'Section Title',
              description: 'e.g. Section A, Section 1',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'items',
              type: 'array',
              title: 'Innovative Teaching Entries',
              of: [
                {
                  type: 'object',
                  name: 'innovativeTeachingItem',
                  title: 'Innovative Teaching Entry',
                  fields: [
                    defineField({
                      name: 'name',
                      type: 'string',
                      title: 'Name',
                      description: 'Name of the faculty / student',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'courseCode',
                      type: 'string',
                      title: 'Course Code',
                    }),
                    defineField({
                      name: 'courseName',
                      type: 'string',
                      title: 'Course Name',
                      description: 'Name/title of the course',
                    }),
                    defineField({
                      name: 'typeOfActivity',
                      type: 'string',
                      title: 'Type of Innovative Teaching Activity',
                      description: 'e.g. Flipped Classroom, Problem-Based Learning, etc.',
                    }),
                    defineField({
                      name: 'proof',
                      type: 'url',
                      title: 'Proof (URL)',
                      description: 'Link to proof/evidence of the activity',
                    }),
                  ],
                  preview: {
                    select: {
                      title: 'name',
                      subtitle: 'courseCode',
                    },
                  },
                },
              ],
            }),
          ],
          preview: {
            select: {
              title: 'sectionTitle',
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'yearLabel',
      subtitle: 'semester',
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Untitled',
        subtitle: subtitle ? `${subtitle} Semester` : '',
      }
    },
  },
})
