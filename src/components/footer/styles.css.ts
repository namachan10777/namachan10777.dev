import { style } from "@vanilla-extract/css";
import { contentContainer } from "~/styles/shared.css";
import { vars } from "~/styles/theme.css";

export const footer = style({
  width: "100%",
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  borderTop: `${vars.border.thin} solid ${vars.color.border}`,
  paddingBlock: `${vars.space.sm} ${vars.space.xxl}`,
});

export const content = style([
  contentContainer,
  {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
]);

export const linkIcon = style({
  fontSize: "1.5rem",
  display: "flex",
  padding: vars.space.xs,
  border: `${vars.border.thin} solid transparent`,
  transition: `border-color ${vars.motion.fast} ${vars.motion.easing}`,
  ":hover": {
    borderColor: vars.color.accent,
  },
});

export const nav = style({
  display: "flex",
  flexDirection: "row",
  gap: vars.space.sm,
});
