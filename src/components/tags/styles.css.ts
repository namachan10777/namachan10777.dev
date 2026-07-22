import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const tags = style({
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: vars.space.sm,
  padding: 0,
});

globalStyle(`${tags} li`, {
  display: "inline-flex",
  fontFamily: vars.font.mono,
});

globalStyle(`${tags} li::before`, {
  content: '"#"',
  color: vars.color.accent,
});
