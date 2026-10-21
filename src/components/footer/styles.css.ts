import { style } from "@vanilla-extract/css";
import { labelText, rail, railCrossTop } from "~/styles/shared.css";
import { vars } from "~/styles/theme.css";

export const footer = style({
  width: "100%",
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  borderTop: `${vars.border.thin} solid ${vars.color.line}`,
  paddingBlockEnd: vars.space.xxl,
});

export const content = style([
  rail,
  railCrossTop,
  {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    minHeight: "3rem",
    paddingInlineStart: vars.layout.contentPadding,
    borderBlockEnd: `${vars.border.thin} solid ${vars.color.line}`,
    fontStyle: "normal",
  },
]);

export const handle = style([labelText, { alignSelf: "center" }]);

export const linkIcon = style({
  fontSize: "1.25rem",
  display: "flex",
  alignItems: "center",
  paddingInline: vars.space.lg,
  borderInlineStart: `${vars.border.thin} solid ${vars.color.line}`,
  color: vars.color.muted,
  transition: `color ${vars.motion.fast} ${vars.motion.easing}, background-color ${vars.motion.fast} ${vars.motion.easing}`,
  selectors: {
    "&:visited": { color: vars.color.muted },
    "&:hover": {
      color: vars.color.text,
      backgroundColor: vars.color.surface,
    },
  },
});

export const nav = style({
  display: "flex",
  flexDirection: "row",
});
