import { globalStyle, style } from "@vanilla-extract/css";
import { media, vars } from "~/styles/theme.css";

export const root = style({
  vars: {
    "--shiki-token-string": vars.color.syntax.string,
    "--shiki-token-keyword": vars.color.syntax.keyword,
    "--shiki-token-function": vars.color.syntax.function,
    "--shiki-token-constant": vars.color.syntax.constant,
    "--shiki-foreground": vars.color.syntax.foreground,
    "--shiki-token-comment": vars.color.syntax.comment,
  },
  fontFamily: vars.font.mono,
  display: "flex",
  flexDirection: "column",
  border: `${vars.border.thin} solid ${vars.color.border}`,
  overflow: "hidden",
});

export const pre = style({
  marginBlock: 0,
  paddingInline: vars.space.sm,
  border: 0,
  minWidth: "100%",
  width: "max-content",
  boxSizing: "border-box",
  lineHeight: vars.lineHeight.body,
});

export const lines = style({
  userSelect: "none",
  display: "flex",
  flexDirection: "column",
  marginBlock: 0,
  paddingInline: vars.space.sm,
  paddingBlock: vars.space.md,
  textAlign: "right",
  fontSize: vars.fontSize.small,
  lineHeight: vars.lineHeight.body,
  listStyle: "none",
  color: vars.color.syntax.comment,
  borderRight: `${vars.border.thin} solid ${vars.color.border}`,
});

globalStyle(`${lines} li`, {
  display: "inline-block",
});

export const header = style({
  display: "grid",
  gridTemplateColumns: "1fr auto",
  minHeight: "1.75rem",
  borderBottom: `${vars.border.thin} solid ${vars.color.border}`,
});

export const headerTitle = style({
  gridColumn: "1",
  paddingInline: vars.space.sm,
  alignSelf: "center",
  fontSize: vars.fontSize.small,
  lineHeight: "1",
});

export const copyButton = style({
  border: 0,
  borderLeft: `${vars.border.thin} solid ${vars.color.border}`,
  backgroundColor: "transparent",
  color: vars.color.text,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: vars.space.xs,
  minHeight: "1.75rem",
  paddingBlock: 0,
  paddingInline: vars.space.sm,
  fontSize: vars.fontSize.xsmall,
  cursor: "pointer",
  transition: `color ${vars.motion.fast} ${vars.motion.easing}`,
  ":hover": {
    color: vars.color.accent,
  },
});

globalStyle(`${copyButton} svg`, {
  width: "0.875rem",
  height: "0.875rem",
});

export const codeBody = style({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  fontSize: vars.fontSize.small,
});

export const scrollBox = style({
  paddingBlock: vars.space.md,
  overflowX: "auto",
  minWidth: 0,
  maxWidth: "100%",
  scrollbarGutter: "stable",
});

globalStyle(`${pre} > code`, {
  display: "block",
  color: "unset",
});

globalStyle(`${pre} > code .function`, {
  color: vars.color.syntax.function,
});

globalStyle(`${pre} > code .function > span:not(.function)`, {
  color: vars.color.codeText,
});

globalStyle(`${pre} > code .keyword`, {
  color: vars.color.syntax.keyword,
});

globalStyle(`${pre} > code .storage`, {
  color: vars.color.syntax.constant,
});

globalStyle(`${pre} > code .string`, {
  color: vars.color.syntax.string,
});

globalStyle(`${pre} > code .comment`, {
  color: vars.color.syntax.comment,
  fontStyle: "italic",
});

globalStyle(`${pre} > code .variable`, {
  color: vars.color.syntax.constant,
});

globalStyle(`${root} *`, {
  "@media": {
    [media.reducedMotion]: {
      scrollBehavior: "auto",
    },
  },
});
