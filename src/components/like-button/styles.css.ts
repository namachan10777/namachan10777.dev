import { style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const likeButton = style({
  border: `${vars.border.thin} solid ${vars.color.border}`,
  backgroundColor: "transparent",
  color: vars.color.text,
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: vars.space.xs,
  cursor: "pointer",
  transition: `border-color ${vars.motion.fast} ${vars.motion.easing}, color ${vars.motion.fast} ${vars.motion.easing}`,
  ":hover": {
    borderColor: vars.color.accent,
    color: vars.color.accent,
  },
});

export const icon = style({ fontSize: "1.25rem" });
export const count = style({ fontSize: "1rem" });
