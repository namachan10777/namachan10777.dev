import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const iconWrapper = style({
  maxWidth: "12rem",
  overflow: "hidden",
  border: `${vars.border.thin} solid ${vars.color.border}`,
});

globalStyle(`${iconWrapper} > img`, {
  width: "12rem",
  height: "12rem",
  display: "block",
});

export const top = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginBlock: vars.space.lg,
});
