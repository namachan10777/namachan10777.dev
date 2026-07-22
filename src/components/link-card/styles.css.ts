import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const root = style({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: vars.space.sm,
  border: `${vars.border.thin} solid ${vars.color.border}`,
  marginBlock: vars.space.sm,
  color: vars.color.text,
  textDecoration: "none",
  transition: `border-color ${vars.motion.fast} ${vars.motion.easing}, color ${vars.motion.fast} ${vars.motion.easing}`,
  ":hover": {
    borderColor: vars.color.accent,
    color: vars.color.accent,
  },
});

export const imageWrapper = style({
  width: "2rem",
  height: "2rem",
  minWidth: "2rem",
  minHeight: "2rem",
  overflow: "hidden",
});

globalStyle(`${imageWrapper} > img`, {
  width: "auto",
  height: "100%",
  objectFit: "contain",
});

export const textWrapper = style({
  height: "100%",
  width: "100%",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  paddingLeft: vars.space.sm,
  marginLeft: vars.space.sm,
  borderLeft: `${vars.border.thin} solid ${vars.color.border}`,
});

export const title = style({
  fontWeight: 700,
  width: "100%",
  margin: 0,
});

export const description = style({
  color: vars.color.muted,
  marginBlock: vars.space.xs,
});

export const domain = style({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: vars.space.xs,
  overflowWrap: "anywhere",
});
