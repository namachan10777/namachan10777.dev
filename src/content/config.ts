import { defineCollection, z } from "astro:content";
import { dateDetailLevelValidator } from "@lib/util";

const post = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.date(),
      description: z.string(),
      publish: z.boolean(),
      tags: z.array(z.string()),
      images: z.array(image()).nullish(),
    }),
});

const pub = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string(),
    booktitle: z.string(),
    href: z.string().nullish(),
    date: z.date(),
  }),
});

const event = defineCollection({
  type: "data",
  schema: z.object({
    date: z.date(),
    title: z.string(),
    dateDetailLevel: dateDetailLevelValidator,
  }),
});

export const collections = {
  post,
  pub,
  event,
};
