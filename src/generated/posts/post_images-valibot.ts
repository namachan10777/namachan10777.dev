import * as rudis from "../rudis-valibot";
import * as v from "valibot";
export const imageColumn = rudis.imageReference(rudis.r2StoragePointer);
export const frontmatter = v.object({
  src_id: v.string(),
  image: imageColumn,
});
export const table = v.object({
  src_id: v.string(),
  image: v.pipe(v.string(), v.parseJson(), imageColumn),
});
export const frontmatterWithMarkdownColumns = v.object({
  src_id: v.string(),
  image: imageColumn,
});
