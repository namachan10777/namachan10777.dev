import { z, defineCollection } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    category: z.array(z.string()),
    description: z.string(),
    date: z.date(),
    title: z.string(),
    publish: z.boolean(),
  }),
});

export const collections = {
  blog,
};
