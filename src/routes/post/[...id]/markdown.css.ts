import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const header = style({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
});

globalStyle(`${header} h1`, {
  fontSize: vars.fontSize.title,
  lineHeight: "1.2",
});
