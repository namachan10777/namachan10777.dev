import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const authors = style({
  display: "inline",
  padding: 0,
});

globalStyle(`${authors} li`, {
  display: "inline-flex",
});

globalStyle(`${authors} li::after`, {
  content: '","',
  marginInlineEnd: vars.space.xs,
});

globalStyle(`${authors} strong`, {
  display: "inline",
});
