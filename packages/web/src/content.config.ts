import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";
import { dateDetailLevelValidator } from "~/lib/util";

const post = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.{md,mdx}",
    base: "content/post",
  }),
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
  loader: glob({
    pattern: "**/[^_]*.{yml,yaml}",
    base: "content/pub",
  }),
  schema: z.object({
    title: z.string(),
    booktitle: z.string(),
    href: z.string().nullish(),
    date: z.date(),
  }),
});

const event = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.{yml,yaml}",
    base: "content/event",
  }),
  schema: z.object({
    date: z.date(),
    title: z.string(),
    dateDetailLevel: dateDetailLevelValidator,
  }),
});

const thirdparty = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.{yml,yaml}",
    base: "content/thirdparty",
  }),
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
