import { defineConfig, defineCollection } from "@content-collections/core";

const blog = defineCollection({
  name: "blog",
  directory: "src/content/blog",
  include: "**/*.mdx",
  schema: (z) => ({
    title: z.string(),
    date: z.string(),
    category: z.array(z.string()),
    publish: z.boolean(),
    description: z.string(),
  }),
});

export default defineConfig({
  collections: [blog],
});
