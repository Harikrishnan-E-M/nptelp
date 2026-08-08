import {defineField, defineType} from 'sanity'

// ── Co-Curricular with SDG Mapping — upload document (singleton style) ────────
// One document holds the CSV file; on Publish the plugin parses it and
// creates/replaces all coCurricularSdgData records globally (no year grouping).
export const coCurricularSdg = defineType({
  name: 'coCurricularSdg',
  type: 'document',
  title: 'Co-Curricular SDG Upload',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'e.g., Co-Curricular SDG Mapping CSV',
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
        'Upload the Co-Curricular SDG CSV. Expected columns: S.No, Course Code & Title, Type of Learning / Activity, Relevance to Complex Engineering Problems, Sustainable Development Goals, Problem Statement, Link',
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
