import { keyframes, style } from "@vanilla-extract/css";
import { media, vars } from "~/styles/theme.css";

const progress = keyframes({
  "0%": { width: "0%" },
  "20%": { width: "30%" },
  "50%": { width: "60%" },
  "80%": { width: "85%" },
  "100%": { width: "95%" },
});

const hatch = keyframes({
  "0%": { backgroundPosition: "0 0" },
  "100%": { backgroundPosition: "8.5px 0" },
});

export const container = style({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: "3px",
  zIndex: 9999,
  pointerEvents: "none",
});

export const bar = style({
  position: "absolute",
  top: 0,
  left: 0,
  height: "100%",
  background: `repeating-linear-gradient(-45deg, ${vars.color.text} 0, ${vars.color.text} 2px, transparent 2px, transparent 6px)`,
  opacity: 0.6,
  transformOrigin: "left",
  animation: `${progress} 0.8s ease-out forwards, ${hatch} 0.3s linear infinite`,
  borderBottom: `${vars.border.thin} solid ${vars.color.text}`,
  borderRight: `${vars.border.thin} solid ${vars.color.text}`,
  "@media": {
    [media.reducedMotion]: {
      width: "95%",
      animation: "none",
    },
  },
});
