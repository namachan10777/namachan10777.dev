import tseslint from "typescript-eslint";
import typescriptParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import javascript from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat();

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", ".content-collections", "server", "tmp"],
  },
  javascript.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  ...compat.extends("plugin:qwik/recommended"),
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "prefer-spread": "off",
      "no-case-declarations": "off",
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-unnecessary-condition": "warn",
    },
  },
);
