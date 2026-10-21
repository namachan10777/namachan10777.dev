import { globalStyle, style } from "@vanilla-extract/css";
import { ruled } from "~/styles/shared.css";
import { media, vars } from "~/styles/theme.css";

export const section = style([ruled, { paddingBlock: vars.space.xxl }]);

export const profile = style({
  display: "grid",
  gridTemplateColumns: "10rem minmax(0, 1fr)",
  gap: vars.space.xl,
  alignItems: "start",
  "@media": {
    [media.mobile]: { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

export const iconWrapper = style({
  width: "10rem",
  aspectRatio: "1",
  maxWidth: "100%",
  overflow: "hidden",
  border: `${vars.border.thin} solid ${vars.color.line}`,
  padding: vars.space.sm,
  backgroundColor: vars.color.surface,
});

globalStyle(`${iconWrapper} > img`, {
  width: "100%",
  height: "100%",
  display: "block",
});

export const profileText = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
});

globalStyle(`${profileText} h1`, {
  marginBlock: 0,
  fontSize: "clamp(2rem, 1.5rem + 2vw, 2.75rem)",
});

globalStyle(`${profileText} p`, {
  marginBlock: 0,
  color: vars.color.muted,
});

// 罫線で区切った行リスト
export const rows = style({
  margin: 0,
  padding: 0,
  listStyle: "none",
  borderTop: `${vars.border.thin} solid ${vars.color.line}`,
});

globalStyle(`${rows} > li`, {
  paddingBlock: vars.space.md,
  borderBottom: `${vars.border.thin} dashed ${vars.color.line}`,
});

globalStyle(`${rows} > li:last-child`, {
  borderBottomStyle: "solid",
});

export const timeline = style([rows]);

globalStyle(`${timeline} > li`, {
  paddingBlock: vars.space.lg,
});

// 罫線で仕切ったリンクのセル
export const linkGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
  margin: 0,
  padding: 0,
  listStyle: "none",
  borderTop: `${vars.border.thin} solid ${vars.color.line}`,
  borderLeft: `${vars.border.thin} solid ${vars.color.line}`,
});

globalStyle(`${linkGrid} > li`, {
  borderRight: `${vars.border.thin} solid ${vars.color.line}`,
  borderBottom: `${vars.border.thin} solid ${vars.color.line}`,
});

globalStyle(`${linkGrid} a`, {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: vars.space.sm,
  padding: vars.space.lg,
  color: vars.color.text,
  textDecoration: "none",
  transition: `color ${vars.motion.fast} ${vars.motion.easing}, background-color ${vars.motion.fast} ${vars.motion.easing}`,
});

globalStyle(`${linkGrid} a::after`, {
  content: '"→"',
  fontFamily: vars.font.mono,
  color: vars.color.muted,
  transition: `transform ${vars.motion.fast} ${vars.motion.easing}`,
});

globalStyle(`${linkGrid} a:hover`, {
  color: vars.color.accent,
  backgroundColor: vars.color.surface,
});

globalStyle(`${linkGrid} a:hover::after`, {
  color: vars.color.accent,
  transform: "translateX(0.2em)",
});
