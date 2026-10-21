import { globalStyle, style } from "@vanilla-extract/css";
import { interactiveSurface, labelText } from "~/styles/shared.css";
import { vars } from "~/styles/theme.css";

export const nav = style({
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
});

const pageLink = style([
  interactiveSurface,
  labelText,
  {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    gap: vars.space.sm,
    paddingBlock: vars.space.sm,
    paddingInline: vars.space.lg,
    color: vars.color.text,
    textDecoration: "none",
    selectors: {
      "&:visited": { color: vars.color.text },
    },
  },
]);

globalStyle(`${pageLink} > *`, {
  display: "block",
});

export const prev = style([pageLink, { gridColumn: "1" }]);
export const next = style([pageLink, { gridColumn: "3" }]);
