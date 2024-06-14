import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import remarkSectionize from "remark-sectionize";
import tsConfigPaths from "vite-tsconfig-paths";

// https://astro.build/config
export default defineConfig({
  site: "https://www.namachan10777.dev",
  prefetch: true,
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
