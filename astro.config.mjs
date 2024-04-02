import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import remarkSectionize from "remark-sectionize";
import solidJs from "@astrojs/solid-js";
import tsConfigPaths from "vite-tsconfig-paths";

// https://astro.build/config
export default defineConfig({
  site: "https://www.namachan10777.dev",
  integrations: [
    icon(),
    sitemap(),
    tailwind(),
    mdx(),
    solidJs({
      exclude: ["src/components/ogp/ogp.tsx"],
    }),
  ],
  markdown: {
    remarkPlugins: [remarkSectionize],
  },
  vite: {
    plugins: [tsConfigPaths()],
    build: {
      rollupOptions: {
        external: ["/pagefind/pagefind.js?url"],
      },
    },
  },
});
