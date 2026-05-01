export default {
  extends: ["stylelint-config-standard"],
  rules: {
    "custom-property-empty-line-before": null,
    "custom-property-pattern": null,
    "declaration-property-value-keyword-no-deprecated": null,
    "hue-degree-notation": null,
    "no-descending-specificity": null,
    "number-max-precision": null,
    "rule-empty-line-before": null,
    "selector-class-pattern": null,
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global"],
      },
    ],
    "value-keyword-case": null,
  },
};
