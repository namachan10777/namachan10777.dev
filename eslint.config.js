import tsEslint from "typescript-eslint";
import eslint from "@eslint/js";
import astroEslint from "eslint-plugin-astro";

export default tsEslint.config(
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...astroEslint.configs["flat/all"],
  {
    rules: {
      "astro/no-unused-css-selector": 0,
    },
  },
);
