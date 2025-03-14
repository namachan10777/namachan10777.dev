import { defineCollection, z } from 'astro:content';

// Define the schema for the post collection
const postCollection = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      tags: z.array(z.string()).optional(),
      date: z.date(),
      description: z.string(),
      title: z.string(),
      publish: z.boolean().default(true),
      og_image: image().optional(), // OGP画像用の背景画像のパス
    }),
});

const publicationCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    booktitle: z.string(),
    href: z.string().optional(),
  }),
});

// Export the collections
export const collections = {
  post: postCollection,
  pub: publicationCollection,
};
