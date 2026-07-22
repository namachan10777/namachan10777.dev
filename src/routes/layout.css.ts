import { style } from "@vanilla-extract/css";
import { contentContainer } from "~/styles/shared.css";

export const container = style({
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  minHeight: "100%",
});

export const main = style({
  width: "100%",
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
});

export const content = style([
  contentContainer,
  {
    height: "100%",
  },
]);
