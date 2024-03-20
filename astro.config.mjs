import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import remarkSectionize from "remark-sectionize";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.namachan10777.dev",
  integrations: [icon(), react(), sitemap()],
  markdown: {
    remarkPlugins: [remarkSectionize],
  },
});
