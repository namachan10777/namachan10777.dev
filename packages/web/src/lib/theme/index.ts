import { GiscusAdapter } from "./giscus";

export type Theme = "light" | "dark";

export const ariaLabel: Record<Theme, string> = {
  dark: "ライトモードにする",
  light: "ダークモードにする",
};

export interface ThemeAdapter {
  init(theme: Theme): void;
  apply(theme: Theme): void;
}

export const adapters: ThemeAdapter[] = [new GiscusAdapter()];
