import remarkLinkCard from "./src/remark/plugin/link-card";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
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
    react(),
  ],
  markdown: {
    remarkPlugins: [
      remarkSectionize,
      remarkGemoji,
      remarkGfm,
      remarkMath,
      remarkLinkCard,
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [
        rehypePrettyCode,
        { theme: { dark: "github-dark", light: "github-light" } },
      ],
    ],
    syntaxHighlight: false,
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
    smartypants: false,
  },
  vite: {
    css: {
      transformer: "lightningcss",
    },
    build: {
      cssMinify: true,
    },
    plugins: [tsConfigPaths(), vanillaExtractPlugin()],
  },
});
