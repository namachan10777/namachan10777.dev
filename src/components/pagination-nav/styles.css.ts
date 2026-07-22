import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "~/styles/theme.css";

export const nav = style({
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
});

globalStyle(`${nav} a`, {
  display: "flex",
  alignItems: "center",
  flexDirection: "row",
  gap: vars.space.sm,
});

globalStyle(`${nav} a > *`, {
  display: "block",
});

export const prev = style({ gridColumn: "1" });
export const next = style({ gridColumn: "3" });
