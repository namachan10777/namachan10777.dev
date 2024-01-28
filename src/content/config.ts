import { z, defineCollection } from "astro:content";

const diary = defineCollection({
  type: "content",
  schema: z.object({
    date: z.string(),
  }),
});

const blog = defineCollection({
  type: "content",
  schema: z.object({
    category: z.array(z.string()),
    description: z.string(),
    date: z.date(),
    title: z.string(),
  }),
});

export const collections = {
  blog,
  diary,
};
