import { globalStyle, style } from "@vanilla-extract/css";
import { labelText, ruled, ruledBottom } from "~/styles/shared.css";
import { vars } from "~/styles/theme.css";

export const header = style([
  ruledBottom,
  {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: vars.space.md,
    paddingBlock: `${vars.space.xxl} ${vars.space.xl}`,
    marginBlockEnd: vars.space.xl,
  },
]);

export const meta = style(labelText);

globalStyle(`${header} h1`, {
  marginBlock: 0,
  fontSize: "clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem)",
});

globalStyle(`${header} p`, {
  marginBlock: 0,
  color: vars.color.muted,
});

export const comments = style([ruled, { paddingBlockStart: vars.space.xl }]);
