// @ts-check

import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";
import remarkImageExtract from "remark-image-extract";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkSectionize from "remark-sectionize";
import { unified } from "unified";
import { defineConfig, s } from "velite";

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
          content: s.custom().transform(async (_, { meta }) => {
            const mdast = unified()
              .use(remarkParse)
              .use(remarkGfm)
              .use(remarkMath)
              .use(remarkGemoji)
              .use(remarkSectionize)
              .parse(meta.content);
            await remarkImageExtract({ documentPath: meta.path })(mdast);
            return mdast;
          }),
          excerpt: s.excerpt(),
        })
        .transform((data, { meta }) => {
          const matched = /post\/(\d{4}\/[^/]+\.md)$/.exec(meta.path);
          return {
            ...data,
            slug: matched ? matched[1] : "",
          };
        }),
    },
  },
});
