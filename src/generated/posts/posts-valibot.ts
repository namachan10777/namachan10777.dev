import * as rudis from "../rudis-valibot"
import * as v from "valibot";
export const ogImageColumn = rudis.imageReference(rudis.r2StoragePointer);
export const frontmatter = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  date: v.pipe(v.string(), v.isoDate(), v.transform((date) => new Date(date))),
  publish: v.nullable(v.boolean()),
  tags: v.array(post_tags.frontmatterWithMarkdownColumns),
  hash: v.string(),
  og_image: v.nullable(ogImageColumn),
});
export const bodyKeep = v.union([
  rudis.alertKeep,
  rudis.footnoteReferenceKeep,
  rudis.linkCardKeep,
  rudis.codeblockKeep,
  rudis.headingKeep,
  rudis.imageKeep(rudis.r2StoragePointer),
]);
export const bodyRoot = rudis.markdownRoot(bodyKeep);
export const bodyDocument = rudis.markdownDocument(frontmatter, bodyKeep);
export const bodyColumn = rudis.markdownReference(rudis.kvStoragePointer);
import * as post_tags from "./post_tags-valibot"
export const table = v.object({
  id: v.string(),
  body: v.pipe(v.string(), v.parseJson(), bodyColumn),
  title: v.string(),
  description: v.string(),
  date: v.pipe(v.string(), v.isoDate(), v.transform((date) => new Date(date))),
  publish: v.nullable(v.pipe(v.number(), v.integer(), v.transform((flag) => flag === 1), v.boolean())),
  hash: v.string(),
  og_image: v.nullable(v.pipe(v.string(), v.parseJson(), ogImageColumn)),
});
export const frontmatterWithMarkdownColumns = v.object({
  id: v.string(),
  body: bodyColumn,
  title: v.string(),
  description: v.string(),
  date: v.pipe(v.string(), v.isoDate(), v.transform((date) => new Date(date))),
  publish: v.nullable(v.boolean()),
  tags: v.array(post_tags.frontmatterWithMarkdownColumns),
  hash: v.string(),
  og_image: v.nullable(ogImageColumn),
});
