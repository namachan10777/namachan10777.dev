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
    og_image: z.string().optional(), // OGP画像用の背景画像のパス
  }),
});

// Export the collections
export const collections = {
  post: postCollection,
};
