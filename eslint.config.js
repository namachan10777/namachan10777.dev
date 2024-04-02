import tsEslint from "typescript-eslint";
import eslint from "@eslint/js";
import astroEslint from "eslint-plugin-astro";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat();

export default tsEslint.config(
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...astroEslint.configs["flat/all"],
  ...compat.plugins("import", "tailwindcss"),
  {
    rules: {
      "astro/no-unused-css-selector": 0,
    },
  },
);
