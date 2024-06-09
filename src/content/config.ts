import { defineCollection, z } from "astro:content";

const post = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),
    publish: z.boolean(),
    tags: z.array(z.string()),
  }),
});

const pub = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string(),
    booktitle: z.string(),
    href: z.string().nullish(),
    year: z.number(),
  }),
});

const event = defineCollection({
  type: "data",
  schema: z.object({
    date: z.date(),
    title: z.string(),
  }),
});

export const collections = {
  post,
  pub,
  event,
};
