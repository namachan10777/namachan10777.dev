import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

// Define the schema for the post collection
const postCollection = defineCollection({
  type: 'content',
  schema: z.object({
    tags: z.array(z.string()).optional(),
    date: z.date(),
    description: z.string(),
    title: z.string(),
    publish: z.boolean().default(true),
  }),
});

// Export the collections
export const collections = {
  'post': postCollection,
};
