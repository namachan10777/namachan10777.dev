import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const container = style({
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  height: "100%",
});

export const header = style({
  display: "flex",
  flexDirection: "column-reverse",
  gap: vars.space.sm,
  paddingBlock: `${vars.space.xxl} ${vars.space.xl}`,
});

globalStyle(`${header} h1, ${header} p`, {
  marginBlock: 0,
});

globalStyle(`${header} p`, {
  color: vars.color.muted,
  fontSize: vars.fontSize.small,
});

export const navContainer = style({
  paddingBlock: vars.space.xl,
});
