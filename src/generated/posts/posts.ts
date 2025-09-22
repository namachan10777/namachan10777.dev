import * as rudis from "../rudis"
import * as post_tags from "./post_tags"
export type BodyKeep = 
  | rudis.AlertKeep
  | rudis.FootnoteReferenceKeep
  | rudis.LinkCardKeep
  | rudis.CodeblockKeep
  | rudis.HeadingKeep
  | rudis.ImageKeep<rudis.R2StoragePointer>;
export type BodyRoot = rudis.MarkdownRoot<BodyKeep>;
export type BodyDocument = rudis.MarkdownDocument<Frontmatter, BodyKeep>;
export type BodyColumn = rudis.MarkdownReference<rudis.KvStoragePointer>;
export type OgImageColumn = rudis.ImageReference<rudis.R2StoragePointer>;
export interface Table {
  id: string;
  body: BodyColumn;
  title: string;
  description: string;
  date: Date;
  publish: boolean | null;
  hash: string;
  og_image: OgImageColumn | null;
}
export interface Frontmatter {
  id: string;
  title: string;
  description: string;
  date: Date;
  publish: boolean | null;
  tags: post_tags.FrontmatterWithMarkdownColumns[];
  hash: string;
  og_image: OgImageColumn | null;
}
export interface FrontmatterWithMarkdownColumns {
  id: string;
  body: BodyColumn;
  title: string;
  description: string;
  date: Date;
  publish: boolean | null;
  tags: post_tags.FrontmatterWithMarkdownColumns[];
  hash: string;
  og_image: OgImageColumn | null;
}
