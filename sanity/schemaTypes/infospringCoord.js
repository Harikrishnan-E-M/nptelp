import {defineField, defineType} from 'sanity'

// ── Infosys Springboard — Coordinator document ────────────────────────────────
// Multiple coordinator documents can be created inside each academic year.
// Each coordinator document captures course details + a CSV of student results.
export const infospringCoord = defineType({
  name: 'infospringCoord',
  type: 'document',
  title: 'Infosys Springboard — Course Coordinator',
  fields: [
    // ── Parent reference ────────────────────────────────────────────────────
    defineField({
      name: 'year',
      type: 'reference',
      to: [{type: 'infospringYear'}],
      title: 'Academic Year',
      validation: (Rule) => Rule.required(),
      weak: true,
    }),
    // ── Course meta ─────────────────────────────────────────────────────────
    defineField({
      name: 'courseCode',
      type: 'string',
      title: 'Course Code',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'courseNameCurriculum',
      type: 'string',
      title: 'Course Name as per Curriculum',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'courseTitleSpringboard',
      type: 'string',
      title: 'Course Title as offered by Infosys Springboard',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'courseDuration',
      type: 'string',
      title: 'Course Duration',
      description: 'e.g. 30 Hours',
    }),
    defineField({
      name: 'coordinatorName',
      type: 'string',
      title: 'Name of the Course Coordinator',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coordinatorEmail',
      type: 'string',
      title: 'Course Coordinator Mail ID (edu id)',
    }),
    defineField({
      name: 'coordinatorPhone',
      type: 'string',
      title: 'Phone Number',
    }),
    // ── CSV upload ───────────────────────────────────────────────────────────
    defineField({
      name: 'csvFile',
      type: 'file',
      title: 'Student List CSV',
      description:
        'Upload CSV with columns: Register Number | Name | Certificates Drive Link. The first row is treated as a header and skipped.',
      options: {accept: '.csv'},
    }),
    // ── Auto-filled tracking fields ──────────────────────────────────────────
    defineField({
      name: 'dataCount',
      type: 'number',
      title: 'Student Count',
      readOnly: true,
      hidden: true,
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
  ],
  preview: {
    select: {
      title: 'coordinatorName',
      courseCode: 'courseCode',
      courseName: 'courseNameCurriculum',
      dataCount: 'dataCount',
    },
    prepare({title, courseCode, courseName, dataCount}) {
      return {
        title: title || 'Unnamed Coordinator',
        subtitle: `${courseCode || '—'} · ${courseName || '—'} · ${dataCount ?? 0} students`,
      }
    },
  },
})
