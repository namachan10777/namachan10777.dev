import { globalStyle, style } from "@vanilla-extract/css";
import { media, vars } from "~/styles/theme.css";

export const list = style({
  display: "grid",
  margin: 0,
  paddingInlineStart: 0,
  listStyle: "none",
  // 行の罫とホバー塗りをレールまで広げる
  marginInline: `calc(-1 * ${vars.layout.contentPadding})`,
  borderTop: `${vars.border.thin} solid ${vars.color.line}`,
});

globalStyle(`${list} > li`, {
  display: "grid",
  gridTemplateColumns: "9rem minmax(0, 1fr)",
  columnGap: vars.space.lg,
  alignItems: "baseline",
  paddingBlock: vars.space.xl,
  paddingInline: vars.layout.contentPadding,
  borderBottom: `${vars.border.thin} solid ${vars.color.line}`,
  transition: `background-color ${vars.motion.fast} ${vars.motion.easing}`,
  "@media": {
    [media.mobile]: { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

globalStyle(`${list} > li:hover`, {
  backgroundColor: vars.color.surface,
});

globalStyle(`${list} > li > :not(time)`, {
  gridColumn: "2",
  "@media": {
    [media.mobile]: { gridColumn: "1" },
  },
});

globalStyle(`${list} time`, {
  gridColumn: "1",
  gridRow: "1",
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.xsmall,
  color: vars.color.muted,
  "@media": {
    [media.mobile]: { gridRow: "auto" },
  },
});

globalStyle(`${list} h3`, {
  marginBlock: 0,
  fontSize: vars.fontSize.large,
});

globalStyle(`${list} h3 a, ${list} h3 a:visited`, {
  color: vars.color.text,
  textDecoration: "none",
});

globalStyle(`${list} h3 a:hover`, {
  color: vars.color.accent,
  textDecoration: "underline",
});

globalStyle(`${list} p`, {
  marginBlock: `${vars.space.sm} ${vars.space.md}`,
  color: vars.color.muted,
  fontSize: vars.fontSize.small,
});
