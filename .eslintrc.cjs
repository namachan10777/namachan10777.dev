module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:import/typescript",
    "plugin:astro/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
    extraFileExtensions: [".astro"],
  },
  globals: {
    astroHTML: true,
  },
  plugins: ["@typescript-eslint", "import", "astro"],
  rules: {
    "@typescript-eslint/consistent-type-imports": [
      2,
      {
        prefer: "type-imports",
      },
    ],
    "import/order": [2, { alphabetize: { order: "asc" } }],
  },
  overrides: [
    {
      files: ["*.astro"],
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
    },
    {
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
    },
  ],
};
