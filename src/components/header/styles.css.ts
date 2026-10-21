import { style } from "@vanilla-extract/css";
import { labelText, rail, railCrossBottom } from "~/styles/shared.css";
import { vars } from "~/styles/theme.css";

export const header = style({
  width: "100%",
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  position: "sticky",
  top: 0,
  zIndex: 10,
  borderBottom: `${vars.border.thin} solid ${vars.color.line}`,
  backgroundColor: `color-mix(in oklch, ${vars.color.backdrop} 80%, transparent)`,
  backdropFilter: "blur(8px)",
});

export const content = style([
  rail,
  railCrossBottom,
  {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    minHeight: "3rem",
    paddingInlineStart: vars.layout.contentPadding,
    backgroundColor: `color-mix(in oklch, ${vars.color.background} 80%, transparent)`,
  },
]);

export const logo = style({
  alignSelf: "center",
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.small,
  fontWeight: 600,
  color: vars.color.text,
  textDecoration: "none",
  selectors: {
    "&:visited": { color: vars.color.text },
    "&:hover": { color: vars.color.accent },
  },
});

export const nav = style({
  display: "flex",
  flexDirection: "row",
  height: "100%",
  margin: 0,
  padding: 0,
  listStyle: "none",
});

export const navLink = style([
  labelText,
  {
    display: "flex",
    alignItems: "center",
    height: "100%",
    paddingInline: vars.space.lg,
    borderInlineStart: `${vars.border.thin} solid ${vars.color.line}`,
    textDecoration: "none",
    transition: `color ${vars.motion.fast} ${vars.motion.easing}, background-color ${vars.motion.fast} ${vars.motion.easing}`,
    selectors: {
      "&:visited": { color: vars.color.muted },
      "&:hover": {
        color: vars.color.text,
        backgroundColor: vars.color.surface,
      },
    },
  },
]);
