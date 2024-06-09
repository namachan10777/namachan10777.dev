import { defineCollection, z } from "astro:content";

const postCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),
    publish: z.boolean(),
    tags: z.array(z.string()),
  }),
});

export const collections = {
  post: postCollection,
};
