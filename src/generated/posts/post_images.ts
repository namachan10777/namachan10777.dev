import * as rudis from "../rudis"
export type ImageColumn = rudis.ImageReference<rudis.R2StoragePointer>;
export interface Table {
  src_id: string;
  image: ImageColumn;
}
export interface Frontmatter {
  src_id: string;
  image: ImageColumn;
}
export interface FrontmatterWithMarkdownColumns {
  src_id: string;
  image: ImageColumn;
}
