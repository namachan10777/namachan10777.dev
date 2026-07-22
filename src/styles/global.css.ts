import { globalLayer, globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

const reset = globalLayer("reset");
const base = globalLayer("base");

globalStyle("html", {
  "@layer": {
    [reset]: {
      height: "100%",
      maxWidth: "100vw",
      padding: 0,
      margin: 0,
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
    },
    [base]: {
      backgroundColor: vars.color.background,
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
