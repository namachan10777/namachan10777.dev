/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-html/astro", "stylelint-config-standard"],
  rules: {
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global"],
      },
    ],
  },
  ignoreFiles: [
    "node_modules/**",
    "dist/**",
    ".astro/**",
    "src/layouts/katex.css",
    "public/pagefind/**",
  ],
};
