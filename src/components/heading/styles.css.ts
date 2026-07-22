import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const heading = style({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: vars.space.xs,
});

export const headingAnchor = style({
  display: "flex",
});

globalStyle(`${heading} a`, {
  fontSize: "smaller",
});
