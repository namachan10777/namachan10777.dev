import { defineConfig } from 'astro/config';
import solidJs from "@astrojs/solid-js";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tsConfigPaths from "vite-tsconfig-paths";

// https://astro.build/config
export default defineConfig({
  integrations: [solidJs(), sitemap(), mdx()],
  vite: {
    plugins: [tsConfigPaths()]
  }
});