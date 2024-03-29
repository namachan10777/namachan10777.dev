import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import remarkSectionize from "remark-sectionize";

// https://astro.build/config
export default defineConfig({
  site: "https://www.namachan10777.dev",
  integrations: [icon(), react(), sitemap(), tailwind(), mdx()],
  markdown: {
    remarkPlugins: [remarkSectionize],
  },
});
