export type Theme = "light" | "dark";

export function sanitizeTheme(theme?: string): Theme {
  switch (theme) {
    case "light":
    case "dark":
      return theme;
    default:
      return "light";
  }
}

export function cycleTheme(theme: Theme): Theme {
  switch (theme) {
    case "dark":
      return "light";
    case "light":
      return "dark";
  }
}

export const giscusTheme: { [key in Theme]: string } = {
  light: "light",
  dark: "dark",
};
