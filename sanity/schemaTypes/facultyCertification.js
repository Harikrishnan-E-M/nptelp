import {defineField, defineType} from 'sanity'

export const facultyCertification = defineType({
  name: 'facultyCertification',
  type: 'document',
  title: 'Faculty Certification',
  fields: [
    defineField({
      name: 'yearLabel',
      type: 'string',
      title: 'Year Label',
      description: 'e.g. 2023-24',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'csvFile',
      type: 'file',
      title: 'CSV File',
      description: 'Upload the Faculty Certification CSV file for this year.',
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
      name: 'totalFaculty',
      type: 'number',
      title: 'Total Faculty Count',
      description: 'Enter the total number of faculty (unique) for this year manually.',
    }),
    defineField({
      name: 'completedCount',
      type: 'number',
      title: 'Completed Count',
      description: 'Auto-computed: count of distinct faculty names who have a grade.',
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: 'yearLabel',
      totalFaculty: 'totalFaculty',
      completedCount: 'completedCount',
    },
    prepare({title, totalFaculty, completedCount}) {
      const fac = totalFaculty != null ? `${totalFaculty} faculty` : 'No data yet'
      const comp = completedCount != null ? `, ${completedCount} completed` : ''
      return {
        title: title || 'Untitled Year',
        subtitle: `${fac}${comp}`,
      }
    },
  },
})
