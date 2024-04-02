import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import solidJs from "@astrojs/solid-js";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import remarkSectionize from "remark-sectionize";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://www.namachan10777.dev",
  integrations: [icon(), sitemap(), tailwind(), mdx(), solidJs(), react()],
  markdown: {
    remarkPlugins: [remarkSectionize]
  },
  vite: {
    build: {
      rollupOptions: {
        external: ["/pagefind/pagefind.js?url"]
      }
    }
  }
});