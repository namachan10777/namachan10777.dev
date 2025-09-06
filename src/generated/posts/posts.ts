import * as v from "valibot";
import * as rudis from "../rudis";
import * as post_tags from "./post_tags";


export type BodyColumn = rudis.MarkdownKvStorageColumn;
export type BodyKeep =
  | rudis.Image<rudis.R2StoragePointer>
  | rudis.Alert
  | rudis.Codeblock
  | rudis.FootnoteReference
  | rudis.Heading
  | rudis.LinkCard
export const bodyColumn = rudis.markdownKvStorageColumn;
export type BodyContent = rudis.MarkdownDocument<Frontmatter, BodyKeep>;
  
export type OgImageColumn = rudis.ImageColumn<rudis.R2StoragePointer>;
export const ogImageColumn = rudis.imageColumn(rudis.r2StoragePointer);
  

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
  body: BodyColumn;
  title: string;
  description: string;
  date: Date;
  publish: boolean | null;
  tags: post_tags.Frontmatter[];
  hash: string;
  og_image: OgImageColumn | null;
}

export const table = v.object({
  id: v.string(),
  body: v.pipe(
    v.string(),
    v.transform((json) => JSON.parse(json)),
    bodyColumn,
  ),
  title: v.string(),
  description: v.string(),
  date: v.pipe(
      v.string(),
      v.transform((date) => new Date(date)),
  ),
  publish: v.pipe(
    v.nullable(v.number()),
    v.transform((value) => value === null ? null : value === 1),
    v.nullable(v.boolean()),
  ),
  hash: v.string(),
  og_image: v.pipe(
    v.nullable(v.string()),
    v.transform((json) => json ? JSON.parse(json) : null),
    v.nullable(ogImageColumn),
  ),
});
