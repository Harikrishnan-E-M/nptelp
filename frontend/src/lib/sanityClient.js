import { createClient } from '@sanity/client';

export const client = createClient({
  projectId: '1asbko6r',
  dataset: 'production',
  apiVersion: '2024-01-30',
  useCdn: false,
});
