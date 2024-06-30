import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { transformerCopyButton } from "@rehype-pretty/transformers";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkSectionize from "remark-sectionize";
import tsConfigPaths from "vite-tsconfig-paths";

// https://astro.build/config
export default defineConfig({
  site: "https://www.namachan10777.dev",
  prefetch: true,
  integrations: [
    sitemap(),
    mdx(),
    icon({
      include: {
        iconoir: ["*"],
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkSectionize, remarkGemoji, remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: { dark: "github-dark", light: "github-light" },
          transformers: [
            transformerCopyButton({
              visibility: "always",
              feedbackDuration: 3_000,
            }),
          ],
        },
      ],
    ],
    syntaxHighlight: false,
    smartypants: true,
  },
  vite: {
    css: {
      transformer: "lightningcss",
    },
    build: {
      cssMinify: true,
    },
    plugins: [tsConfigPaths()],
  },
});
