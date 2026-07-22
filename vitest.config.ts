import { defineConfig } from "vitest/config";
import Icons from "unplugin-icons/vite";

export default defineConfig({
  plugins: [Icons({ compiler: "jsx", jsx: "react" })],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
  },
});
