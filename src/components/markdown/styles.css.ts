import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const markdown = style({});

globalStyle(`${markdown} table`, {
  width: "100%",
  display: "block",
  overflowX: "auto",
  borderCollapse: "collapse",
  border: `${vars.border.thin} solid ${vars.color.border}`,
});

globalStyle(`${markdown} th`, {
  borderBottom: `${vars.border.thin} solid ${vars.color.border}`,
  margin: 0,
  backgroundColor: vars.color.surface,
});

globalStyle(`${markdown} th:first-child, ${markdown} td:first-child`, {
  borderRight: `${vars.border.thin} solid ${vars.color.border}`,
});

globalStyle(`${markdown} th, ${markdown} td`, {
  paddingInline: vars.space.sm,
  paddingBlock: vars.space.xs,
});

globalStyle(`${markdown} :not(pre) > code`, {
  backgroundColor: vars.color.codeBackground,
  color: vars.color.codeText,
  paddingInline: "0.2em",
  marginInline: "0.1em",
  paddingBlock: "0.1em",
});

globalStyle(`${markdown} hr`, {
  border: 0,
  borderTop: `${vars.border.thin} solid ${vars.color.border}`,
});

globalStyle(`${markdown} img`, {
  maxWidth: "100%",
  height: "auto",
});

globalStyle(`${markdown} figure img`, {
  margin: vars.space.sm,
  width: `calc(100% - ${vars.space.sm} - ${vars.space.sm})`,
  height: "auto",
});

globalStyle(`${markdown} figure picture`, {
  width: `calc(100% - ${vars.space.sm} - ${vars.space.sm})`,
  height: "auto",
});

globalStyle(`${markdown} figure`, {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  gap: vars.space.sm,
  border: `${vars.border.thin} solid currentColor`,
  marginInline: 0,
  overflow: "hidden",
});

globalStyle(`${markdown} figcaption`, {
  borderTop: `${vars.border.thin} solid currentColor`,
  display: "block",
  width: "100%",
  textAlign: "center",
  paddingBlock: vars.space.sm,
});

globalStyle(`${markdown} p a`, {
  marginInline: "0.2em",
});

export const footnotes = style({
  display: "grid",
  gap: vars.space.lg,
  paddingInline: 0,
  listStyle: "none",
});

export const footnote = style({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  alignItems: "start",
  gap: vars.space.sm,
});

export const footnoteLink = style({
  gridColumn: "1",
  fontFamily: vars.font.mono,
});

export const footnoteBody = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.lg,
  gridColumn: "2",
});

globalStyle(`${footnote} > :not(${footnoteLink})`, {
  gridColumn: "2",
  minWidth: 0,
});

globalStyle(`${footnoteBody} p`, {
  marginBlock: 0,
});
