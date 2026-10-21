import { style } from "@vanilla-extract/css";
import { rail } from "~/styles/shared.css";
import { vars } from "~/styles/theme.css";

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
  rail,
  {
    flexGrow: 1,
    counterReset: "section",
    paddingInline: vars.layout.contentPadding,
    paddingBlockEnd: vars.space.xxl,
  },
]);
