import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'NPTEL Statistics',

  projectId: '1asbko6r',
  dataset: 'production',

  basePath: '/sanity',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
