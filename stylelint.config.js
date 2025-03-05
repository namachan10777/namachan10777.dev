export default {
  extends: ['stylelint-config-standard'],
  overrides: [
    {
      files: ['**/*.astro'],
      customSyntax: 'postcss-html',
    },
  ],
  rules: {
    // Allow Astro's :global() pseudo-class
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
    // CSS variables in media queries are valid in modern browsers
    'media-query-no-invalid': null,
  },
  ignoreFiles: ['node_modules/**/*', 'dist/**/*', '.astro/**/*'],
};
