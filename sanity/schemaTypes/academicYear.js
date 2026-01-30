import {defineField, defineType} from 'sanity'

export const academicYear = defineType({
  name: 'academicYear',
  type: 'document',
  title: 'Academic Year',
  fields: [
    defineField({
      name: 'yearLabel',
      type: 'string',
      title: 'Year Label',
      description: 'e.g., 2023-24',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startYear',
      type: 'number',
      title: 'Start Year',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endYear',
      type: 'number',
      title: 'End Year',
      validation: (Rule) =>
        Rule.required().custom((endYear, context) => {
          const startYear = context.document?.startYear;
          if (startYear && endYear && endYear < startYear) {
            return 'End Year must be greater than or equal to Start Year.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'description',
      type: 'string',
      title: 'Description',
    }),
    defineField({
      name: 'csvFile',
      type: 'file',
      title: 'CSV File',
      description: 'Upload the NPTEL CSV file for this academic year.',
      options: {
        accept: '.csv',
      },
    }),
    defineField({
      name: 'csvAssetId',
      type: 'string',
      title: 'CSV Asset ID',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'csvImportedAt',
      type: 'datetime',
      title: 'CSV Imported At',
      readOnly: true,
    }),
    defineField({
      name: 'dataCount',
      type: 'number',
      title: 'Data Count',
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: 'yearLabel',
      subtitle: 'description',
    },
  },
})
