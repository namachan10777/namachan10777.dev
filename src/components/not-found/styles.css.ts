import { globalStyle, style } from "@vanilla-extract/css";
import { labelText } from "~/styles/shared.css";
import { vars } from "~/styles/theme.css";

export const container = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  paddingBlock: "6rem",
  gap: vars.space.md,
});

globalStyle(`${container} h1, ${container} p`, { marginBlock: 0 });

export const code = style([labelText, { color: vars.color.accent }]);
