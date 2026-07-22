import { globalStyle, style } from "@vanilla-extract/css";
import { interactiveSurface } from "~/styles/shared.css";
import { media, vars } from "~/styles/theme.css";

export const commentSection = style({ marginTop: vars.space.xxl });

globalStyle(`${commentSection} h2`, {
  marginBottom: vars.space.lg,
});

export const commentList = style({
  display: "flex",
  flexDirection: "column",
  marginBottom: vars.space.xl,
});

export const comment = style({
  paddingBlock: vars.space.md,
  selectors: {
    "&:not(:last-child)": {
      borderBottom: `${vars.border.thin} solid ${vars.color.muted}`,
    },
  },
});

export const commentHeader = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: vars.space.sm,
  marginBottom: vars.space.sm,
});

export const commentName = style({ fontWeight: 700 });
export const commentDate = style({
  fontSize: vars.fontSize.small,
  color: vars.color.muted,
});
export const commentContent = style({
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});
export const noComments = style({
  color: vars.color.muted,
  fontStyle: "italic",
});

export const commentForm = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
});

export const formLabel = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

const formControl = style({
  padding: vars.space.sm,
  border: `${vars.border.thin} solid ${vars.color.border}`,
  backgroundColor: vars.color.background,
  color: vars.color.text,
  transition: `border-color ${vars.motion.fast} ${vars.motion.easing}`,
  ":focus": {
    borderColor: vars.color.focus,
  },
});

export const formInput = style([formControl]);
export const formTextarea = style([
  formControl,
  { minHeight: "100px", resize: "vertical" },
]);

export const formActions = style({
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  gap: vars.space.md,
  "@media": {
    [media.mobile]: {
      alignItems: "stretch",
      flexDirection: "column",
    },
  },
});

export const submitButton = style([
  interactiveSurface,
  {
    padding: `${vars.space.sm} ${vars.space.lg}`,
    selectors: {
      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    },
    "@media": {
      [media.mobile]: { width: "100%" },
    },
  },
]);

export const errorMessage = style({
  color: vars.color.danger,
  fontSize: vars.fontSize.small,
  margin: 0,
});

export const turnstileContainer = style({
  minHeight: "64px",
  maxWidth: "100%",
  overflowX: "auto",
});
