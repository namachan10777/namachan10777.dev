import { style } from "@vanilla-extract/css";
import { contentContainer } from "~/styles/shared.css";
import { vars } from "~/styles/theme.css";

export const header = style({
  width: "100%",
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  paddingBlock: vars.space.sm,
  position: "relative",
});

export const borderLine = style({
  position: "absolute",
  bottom: 0,
  left: 0,
  width: "100%",
  height: vars.border.thin,
  backgroundColor: vars.color.border,
});

export const content = style([
  contentContainer,
  {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
]);

export const link = style({
  fontFamily: vars.font.mono,
  fontWeight: 600,
});
