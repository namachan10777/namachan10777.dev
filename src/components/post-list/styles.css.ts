import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const list = style({
  display: "grid",
  paddingInlineStart: 0,
});

globalStyle(`${list} > li`, {
  display: "grid",
  borderTop: `${vars.border.thin} solid ${vars.color.muted}`,
  paddingBlock: vars.space.sm,
});

globalStyle(`${list} time`, {
  fontSize: vars.fontSize.small,
  color: vars.color.muted,
});

globalStyle(`${list} h3`, {
  marginBlock: vars.space.sm,
});

globalStyle(`${list} p`, {
  marginBlock: `${vars.space.sm} 0`,
});
