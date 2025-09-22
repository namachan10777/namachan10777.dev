import * as rudis from "../rudis-valibot"
import * as v from "valibot";
export const frontmatter = v.object({
  tag: v.string(),
});
export const table = v.object({
  tag: v.string(),
});
export const frontmatterWithMarkdownColumns = v.object({
  tag: v.string(),
});
