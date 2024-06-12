import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwind from "@astrojs/tailwind";
import remarkSectionize from "remark-sectionize";
import icon from "astro-icon";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://www.namachan10777.dev",
  integrations: [
    sitemap(),
    mdx(),
    tailwind(),
    icon({
      include: {
        iconoir: ["*"],
      },
    }),
    react(),
  ],
  markdown: {
    remarkPlugins: [remarkSectionize],
  },
  vite: {
    plugins: [tsConfigPaths()],
  },
});
