import {defineField, defineType} from 'sanity'

export const ictTools = defineType({
  name: 'ictTools',
  type: 'document',
  title: 'ICT Tools',
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
      description: 'Add up to 4 sections. Each section contains a list of ICT tool entries.',
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
              title: 'ICT Tool Entries',
              of: [
                {
                  type: 'object',
                  name: 'ictToolItem',
                  title: 'ICT Tool Entry',
                  fields: [
                    defineField({
                      name: 'name',
                      type: 'string',
                      title: 'Name',
                      description: 'Name of the ICT tool / faculty / student',
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
                      name: 'typeOfIctTool',
                      type: 'string',
                      title: 'Type of ICT Tool',
                      description: 'e.g. Simulation, Video, Animation, etc.',
                    }),
                    defineField({
                      name: 'proofs',
                      type: 'array',
                      title: 'Proof Links',
                      description: 'Add one or more proof/evidence links for this ICT tool entry',
                      of: [
                        {
                          type: 'object',
                          name: 'proofItem',
                          title: 'Proof',
                          fields: [
                            defineField({
                              name: 'label',
                              type: 'string',
                              title: 'Label',
                              description: 'e.g. Proof 1, Certificate, Screenshot',
                            }),
                            defineField({
                              name: 'url',
                              type: 'url',
                              title: 'URL',
                              description: 'Link to the proof',
                              validation: (Rule) => Rule.required(),
                            }),
                          ],
                          preview: {
                            select: { title: 'label', subtitle: 'url' },
                          },
                        },
                      ],
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
