import { style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const container = style({
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  height: "100%",
});

export const navContainer = style({
  marginBlockEnd: vars.space.xl,
});
