import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const post = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './content/post',
  }),
  schema: z.object({
    tags: z.array(z.string()),
    title: z.string(),
    description: z.string(),
    publish: z.boolean(),
    date: z.date(),
  }),
});

export const collections = { post };
