import {
  assignVars,
  createGlobalTheme,
  globalStyle,
} from "@vanilla-extract/css";

const lightColors = {
  background: "oklch(95.57% 0.003 286.35)",
  surface: "oklch(92.04% 0.002 197.12)",
  text: "oklch(14.38% 0.007 256.88)",
  muted: "oklch(43.87% 0.005 271.3)",
  border: "oklch(25.11% 0.006 258.36)",
  accent: "oklch(47.36% 0.185 259.89)",
  accentHover: "oklch(51.15% 0.204 260.17)",
  visited: "oklch(42.77% 0.181 298.49)",
  danger: "oklch(58.63% 0.231 19.6)",
  focus: "oklch(47.36% 0.185 259.89)",
  codeBackground: "oklch(84.61% 0.004 286.31)",
  codeText: "oklch(25.11% 0.006 258.36)",
  syntax: {
    function: "oklch(47.36% 0.185 259.89)",
    keyword: "oklch(49.95% 0.195 18.34)",
    constant: "oklch(42.77% 0.181 298.49)",
    string: "oklch(63.8% 0.142 52.1)",
    comment: "oklch(56.82% 0.004 247.89)",
    foreground: "oklch(64.24% 0.175 144.92)",
  },
};

const darkColors = {
  background: "oklch(18% 0.018 258)",
  surface: "oklch(23% 0.02 258)",
  text: "oklch(93% 0.006 258)",
  muted: "oklch(72% 0.018 258)",
  border: "oklch(52% 0.025 258)",
  accent: "oklch(74% 0.14 255)",
  accentHover: "oklch(80% 0.13 255)",
  visited: "oklch(78% 0.14 300)",
  danger: "oklch(72% 0.17 20)",
  focus: "oklch(74% 0.14 255)",
  codeBackground: "oklch(27% 0.028 258)",
  codeText: "oklch(90% 0.01 258)",
  syntax: {
    function: "oklch(76% 0.12 255)",
    keyword: "oklch(74% 0.16 20)",
    constant: "oklch(78% 0.14 300)",
    string: "oklch(80% 0.13 65)",
    comment: "oklch(65% 0.03 258)",
    foreground: "oklch(78% 0.13 145)",
  },
};

export const vars = createGlobalTheme(":root", {
  color: lightColors,
  font: {
    body: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Roboto Mono", monospace',
  },
  fontSize: {
    xsmall: "0.75rem",
    small: "0.875rem",
    body: "clamp(0.9rem, 0.9rem + 0.1vw, 1rem)",
    large: "1.125rem",
    title: "2rem",
  },
  lineHeight: {
    body: "1.5",
    content: "1.7",
  },
  space: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    xxl: "2rem",
  },
  layout: {
    contentMaxWidth: "52rem",
    contentGutter: "clamp(0.75rem, 3vw, 1rem)",
  },
  border: {
    thin: "1px",
  },
  motion: {
    fast: "120ms",
    easing: "ease-out",
  },
});

globalStyle(":root", {
  colorScheme: "light",
  "@media": {
    "(prefers-color-scheme: dark)": {
      vars: assignVars(vars.color, darkColors),
      colorScheme: "dark",
    },
  },
});

export const media = {
  mobile: "screen and (max-width: 40rem)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
} as const;
