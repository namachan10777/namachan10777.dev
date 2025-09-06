import * as v from "valibot";
import * as rudis from "../rudis";


export type ImageColumn = rudis.ImageColumn<rudis.R2StoragePointer>;
export const imageColumn = rudis.imageColumn(rudis.r2StoragePointer);
  

export interface Table {
  post_id: string;
  src_id: string;
  image: ImageColumn;
}

export interface Frontmatter {
  post_id: string;
  src_id: string;
  image: ImageColumn;
}

export const table = v.object({
  post_id: v.string(),
  src_id: v.string(),
  image: v.pipe(
    v.string(),
    v.transform((json) => JSON.parse(json)),
    imageColumn,
  ),
});
