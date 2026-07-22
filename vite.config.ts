import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import {
  defineConfig,
  type ConfigEnv,
  type ConfigPluginContext,
  type UserConfig,
} from "vite";
import Icons from "unplugin-icons/vite";

const vanillaExtract = vanillaExtractPlugin().map((plugin) => {
  if (
    plugin.name !== "vite-plugin-vanilla-extract" ||
    typeof plugin.config !== "function"
  ) {
    return plugin;
  }

  const configure = plugin.config;
  return {
    ...plugin,
    async config(
      this: ConfigPluginContext,
      config: UserConfig,
      environment: ConfigEnv,
    ) {
      // Preserve the plugin's initialization but discard its SSR externals:
      // Cloudflare Worker environments must bundle all runtime modules, while
      // vanilla-extract compiles these imports away before the Worker build.
      await configure.call(this, config, environment);
      return {};
    },
  };
});

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
    vanillaExtract,
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
