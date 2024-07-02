// @ts-check

import { defineConfig,s } from "velite";

export default defineConfig({
  collections: {
    post: {
      name: "post",
      pattern: "**/*.md",
      schema: s.object({
        title: s.string(),
        date: s.string(),
        modified: s.string().nullish(),
        description: s.string(),
        publish: s.boolean(),
        tags: s.array(s.string()),
        content: s.custom().transform((_, {meta}) => meta.content),
        excerpt: s.excerpt()
      })
    }
  }
});
