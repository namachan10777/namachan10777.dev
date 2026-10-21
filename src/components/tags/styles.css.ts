import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const tags = style({
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: vars.space.xs,
  margin: 0,
  padding: 0,
  listStyle: "none",
});

globalStyle(`${tags} li`, {
  display: "inline-flex",
});

globalStyle(`${tags} a`, {
  display: "inline-flex",
  paddingInline: "0.5em",
  paddingBlock: "0.1em",
  border: `${vars.border.thin} solid ${vars.color.line}`,
  backgroundColor: vars.color.background,
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xsmall,
  color: vars.color.muted,
  textDecoration: "none",
  transition: `color ${vars.motion.fast} ${vars.motion.easing}, border-color ${vars.motion.fast} ${vars.motion.easing}`,
});

globalStyle(`${tags} a::before`, {
  content: '"#"',
  color: vars.color.accent,
});

globalStyle(`${tags} a:hover`, {
  borderColor: vars.color.accent,
  color: vars.color.accent,
});
