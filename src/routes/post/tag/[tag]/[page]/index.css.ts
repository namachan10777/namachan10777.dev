import { style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const tagInHeading = style({
  fontFamily: vars.font.mono,
  color: vars.color.accent,
});

export const header = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space.xxl,
});
