import { staticAdapter } from "@qwik.dev/router/adapters/static/vite";
import { extendConfig } from "@qwik.dev/router/vite";
import baseConfig from "../../vite.config";

// Vite 7 can be installed twice in the graph, which makes Qwik's adapter
// helper see a different `UserConfig` type than our root config export.
export default extendConfig(baseConfig as any, (() => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["@qwik-city-plan"],
      },
    },
    plugins: [
      staticAdapter({
        origin: "https://www.namachan10777.dev",
      }),
    ],
  };
}) as any);
