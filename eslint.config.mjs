import typescriptParser from "@typescript-eslint/parser";
import astroParser from "astro-eslint-parser";
import astro from "eslint-plugin-astro";
import tailwind from "eslint-plugin-tailwindcss";
import typescript from "typescript-eslint";

export default typescript.config(
  {
    ignores: ["node_modules/", "dist/", ".astro/", "src/env.d.ts"],
  },
  ...typescript.configs.strict,
  ...typescript.configs.stylistic,
  ...astro.configs["flat/recommended"],
  ...astro.configs["flat/jsx-a11y-strict"],
  ...tailwind.configs["flat/recommended"],
  {
    files: ["*.astro"],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: typescriptParser,
        project: "./tsconfig.json",
      },
    },
  },
  {
    files: ["*.ts", "*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);
