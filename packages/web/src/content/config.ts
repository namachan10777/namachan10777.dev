import { defineCollection, z } from "astro:content";
import { dateDetailLevelValidator } from "~/lib/util";

const post = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.date(),
      modified: z.date().nullish(),
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

const thirdparty = defineCollection({
  type: "data",
  schema: z.object({
    src: z.string(),
    from: z.array(
      z.object({
        title: z.string(),
        href: z.string().url(),
        license: z.literal("MIT"),
      }),
    ),
  }),
});

export const collections = {
  post,
  pub,
  event,
  thirdparty,
};
