export type Theme = "light" | "dark";

export const ariaLabel: { [key in Theme]: string } = {
  dark: "ライトモードにする",
  light: "ダークモードにする",
};

export interface ThemeProvider {
  register(themeAdapter: ThemeAdapter): void;
}

export interface ThemeAdapter {
  init(theme: Theme): void;
  apply(theme: Theme): void;
}
