import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import remarkSectionize from "remark-sectionize";

import qwikdev from "@qwikdev/astro";

// https://astro.build/config
export default defineConfig({
  site: "https://www.namachan10777.dev",
  integrations: [icon(), sitemap(), tailwind(), mdx(), qwikdev()],
  markdown: {
    remarkPlugins: [remarkSectionize],
  },
});
