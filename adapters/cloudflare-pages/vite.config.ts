import { cloudflarePagesAdapter } from "@qwik.dev/router/adapters/cloudflare-pages/vite";
import { extendConfig } from "@qwik.dev/router/vite";
import baseConfig from "../../vite.config";

// Vite 7 can be installed twice in the graph, which makes Qwik's adapter
// helper see a different `UserConfig` type than our root config export.
export default extendConfig(baseConfig as any, (() => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.cloudflare-pages.tsx"],
      },
    },
    plugins: [cloudflarePagesAdapter()],
  };
}) as any);
