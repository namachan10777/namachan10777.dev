import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

export const contentContainer = style({
  width: `calc(100% - ${vars.layout.contentGutter} - ${vars.layout.contentGutter})`,
  maxWidth: vars.layout.contentMaxWidth,
  marginInline: vars.layout.contentGutter,
});

export const interactiveSurface = style({
  border: `${vars.border.thin} solid ${vars.color.border}`,
  backgroundColor: vars.color.background,
  color: vars.color.text,
  cursor: "pointer",
  transition: `border-color ${vars.motion.fast} ${vars.motion.easing}, color ${vars.motion.fast} ${vars.motion.easing}`,
  ":hover": {
    borderColor: vars.color.accent,
    color: vars.color.accent,
  },
});
