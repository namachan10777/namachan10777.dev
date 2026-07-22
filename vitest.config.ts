import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vitest/config";
import Icons from "unplugin-icons/vite";

export default defineConfig({
  plugins: [vanillaExtractPlugin(), Icons({ compiler: "jsx", jsx: "react" })],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
  },
});
