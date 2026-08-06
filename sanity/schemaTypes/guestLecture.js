import {defineField, defineType} from 'sanity'

// ── Guest Lecture parent document ────────────────────────────────────
export const guestLecture = defineType({
  name: 'guestLecture',
  type: 'document',
  title: 'Guest Lecture',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'e.g., Guest Lectures Organized',
      validation: (Rule) => Rule.required(),
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
      description:
        'Upload the Guest Lecture CSV (Columns: Sl.No., Date, Name of the Programme, Name of the speaker/Designation/Address details, Topic, Proof).',
      options: {accept: '.csv'},
    }),
    // ── Tracking fields (auto-filled on import) ──────────────────────────────
    defineField({
      name: 'dataCount',
      type: 'number',
      title: 'Record Count',
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
      title: 'title',
      subtitle: 'description',
    },
  },
})
