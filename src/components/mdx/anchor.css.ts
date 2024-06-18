import { style } from "@vanilla-extract/css";
import * as layers from "~/layouts/layer.css";

export const root = style({
  "@layer": {
    [layers.component]: {
      color: "var(--fg-link)",
      textDecoration: "underline",
      display: "inline-flex",
      alignItems: "center",
    },
  },
});
