import type { Linter } from "eslint";

declare module "eslint-plugin-qwik" {
  export declare const qwikEslint9Plugin: {
    readonly configs: {
      readonly recommended: { readonly rules: Readonly<Linter.RulesRecord> };
      readonly all: { readonly rules: Readonly<Linter.RulesRecord> };
    };
  };
}
