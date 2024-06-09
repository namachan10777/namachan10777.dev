import { defineConfig } from "astro/config";
import solidJs from "@astrojs/solid-js";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import pagefind from "astro-pagefind";
import tsConfigPaths from "vite-tsconfig-paths";

// https://astro.build/config
export default defineConfig({
  site: "https://www.namachan10777.dev",
  integrations: [solidJs(), sitemap(), mdx(), pagefind()],
  vite: {
    plugins: [tsConfigPaths()],
  },
});
