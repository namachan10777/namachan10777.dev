import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import remarkSectionize from "remark-sectionize";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://www.namachan10777.dev",
  integrations: [icon(), react(), sitemap(), tailwind(), mdx()],
  markdown: {
    remarkPlugins: [remarkSectionize],
  },
});
