import * as v from "valibot";
import * as rudis from "../rudis";



export interface Table {
  post_id: string;
  tag: string;
}

export interface Frontmatter {
  post_id: string;
  tag: string;
}

export const table = v.object({
  post_id: v.string(),
  tag: v.string(),
});
