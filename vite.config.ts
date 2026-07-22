import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import Icons from "unplugin-icons/vite";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
    Icons({ compiler: "jsx", jsx: "react" }),
  ],
  resolve: { tsconfigPaths: true },
  server: {
    headers: { "Cache-Control": "public, max-age=0" },
  },
  preview: {
    headers: { "Cache-Control": "public, max-age=600" },
  },
});
