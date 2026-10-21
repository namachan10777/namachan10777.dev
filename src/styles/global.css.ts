import { globalLayer, globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

const reset = globalLayer("reset");
const base = globalLayer("base");

globalStyle("*, *::before, *::after", {
  "@layer": { [reset]: { boxSizing: "border-box" } },
});

globalStyle("html", {
  "@layer": {
    [reset]: {
      height: "100%",
      maxWidth: "100vw",
      padding: 0,
      margin: 0,
      overflowX: "clip",
    },
  },
});

globalStyle("body", {
  "@layer": {
    [reset]: {
      width: "100%",
      height: "100%",
      maxWidth: "100vw",
      padding: 0,
      margin: 0,
      overflowX: "clip",
    },
    [base]: {
      backgroundColor: vars.color.backdrop,
      backgroundImage: `linear-gradient(to right, ${vars.color.grid} 1px, transparent 1px), linear-gradient(to bottom, ${vars.color.grid} 1px, transparent 1px)`,
      backgroundSize: `${vars.layout.gridPitch} ${vars.layout.gridPitch}`,
      backgroundPosition: "center top",
      color: vars.color.text,
      fontFamily: vars.font.body,
      fontSize: vars.fontSize.body,
      lineHeight: vars.lineHeight.body,
    },
  },
});

globalStyle("p", {
  "@layer": {
    [base]: {
      overflowWrap: "anywhere",
      lineHeight: vars.lineHeight.content,
    },
  },
});

globalStyle("h1, h2, h3, h4", {
  "@layer": {
    [base]: {
      letterSpacing: vars.letterSpacing.heading,
      lineHeight: "1.3",
    },
  },
});

globalStyle("h1", {
  "@layer": {
    [base]: {
      fontSize: vars.fontSize.title,
      fontWeight: 700,
      lineHeight: "1.15",
    },
  },
});

globalStyle("code", {
  "@layer": { [base]: { fontFamily: vars.font.mono } },
});

globalStyle("a", {
  "@layer": {
    [base]: {
      color: vars.color.accent,
      textDecorationThickness: "0.08em",
      textUnderlineOffset: "0.15em",
      transition: `color ${vars.motion.fast} ${vars.motion.easing}`,
    },
  },
});

globalStyle("a:visited", {
  "@layer": { [base]: { color: vars.color.visited } },
});

globalStyle("a:hover", {
  "@layer": { [base]: { color: vars.color.accentHover } },
});

globalStyle("button, input, textarea", {
  "@layer": { [base]: { font: "inherit" } },
});

globalStyle(":focus-visible", {
  outline: `2px solid ${vars.color.focus}`,
  outlineOffset: "2px",
});

globalStyle("::selection", {
  backgroundColor: vars.color.accent,
  color: vars.color.background,
});
