import { fileURLToPath } from "node:url";
import { cloudflarePagesAdapter } from "@qwik.dev/router/adapters/cloudflare-pages/vite";
import { extendConfig } from "@qwik.dev/router/vite";
import baseConfig from "../../vite.config";

const cloudflarePagesEntry = fileURLToPath(
  new URL("../../src/entry.cloudflare-pages.tsx", import.meta.url),
);

// Vite 7 can be installed twice in the graph, which makes Qwik's adapter
// helper see a different `UserConfig` type than our root config export.
export default extendConfig(baseConfig, (() => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: [cloudflarePagesEntry],
      },
    },
    plugins: [cloudflarePagesAdapter()],
  };
}));
