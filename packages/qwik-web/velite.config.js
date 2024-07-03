// @ts-check

import rehypePrettyCode from "rehype-pretty-code";
import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkSectionize from "remark-sectionize";
import { unified } from "unified";
import { defineConfig, s } from "velite";

const parser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkGemoji)
  .use(rehypePrettyCode)
  .use(remarkSectionize);

export default defineConfig({
  collections: {
    post: {
      name: "post",
      pattern: "**/*.md",
      schema: s
        .object({
          title: s.string(),
          date: s.string(),
          modified: s.string().nullish(),
          description: s.string(),
          publish: s.boolean(),
          tags: s.array(s.string()),
          content: s
            .custom()
            .transform((_, { meta }) => parser.parse(meta.content)),
          excerpt: s.excerpt(),
        })
        .transform((data, { meta }) => {
          const slug = /\d{4}\/.+\.md$/.exec(meta.path)?.[1];
          return {
            ...data,
            slug: slug || "",
          };
        }),
    },
  },
});
