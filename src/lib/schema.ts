import { z } from "zod";

const headingTagSchema = z.union([
  z.literal("h1"),
  z.literal("h2"),
  z.literal("h3"),
  z.literal("h4"),
  z.literal("h5"),
  z.literal("h6"),
]);

export type HeadingTag = z.infer<typeof headingTagSchema>;

const custom = z.union([
  z.object({
    type: z.literal("codeblock"),
    title: z.string().nullish(),
    content: z.string(),
    lines: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("heading"),
    tag: headingTagSchema,
    slug: z.string(),
  }),
  z.object({
    type: z.literal("isolated_link"),
    title: z.string(),
    description: z.string(),
    url: z.string(),
    image_url: z.string().nullable(),
  }),
]);

export type HtmlContent = {
  type: "html";
  content: string;
};
export type PartialContent = {
  type: "partial";
  children: FoldedTree[];
};

export type FoldedContent = HtmlContent | PartialContent;

export type FoldedText = {
  type: "text";
  text: string;
};

export type FoldedHtml = {
  type: "html";
  tag: string;
  attrs: Record<string, string | boolean>;
  id: string;
  content: FoldedContent;
};

export type Custom = z.infer<typeof custom>;

export type FoldedKeep = {
  type: "keep";
  custom: Custom;
  id: string;
  content: FoldedContent;
};

export type FoldedTree = FoldedText | FoldedHtml | FoldedKeep;

export const foldedInnerSchema: z.Schema<FoldedContent> = z.lazy(() => {
  const text: z.Schema<FoldedText> = z.object({
    type: z.literal("text"),
    text: z.string(),
  });
  const html: z.Schema<FoldedHtml> = z.object({
    type: z.literal("html"),
    tag: z.string(),
    attrs: z.record(z.string(), z.union([z.string(), z.boolean()])),
    id: z.string(),
    content: foldedInnerSchema,
  });
  const keep: z.Schema<FoldedKeep> = z.object({
    type: z.literal("keep"),
    custom,
    id: z.string(),
    content: foldedInnerSchema,
  });
  const innerHtml: z.Schema<HtmlContent> = z.object({
    type: z.literal("html"),
    content: z.string(),
  });
  const innerPartial: z.Schema<PartialContent> = z.object({
    type: z.literal("partial"),
    children: z.union([text, html, keep]).array(),
  });

  return z.union([innerHtml, innerPartial]);
});

export const postRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  created_at: z.iso.date(),
  og_image: z.string().nullable(),
  og_type: z.string().nullable(),
  publish: z
    .union([z.literal(0), z.literal(1)])
    .transform((flag) => (flag === 1 ? true : false)),
  tags: z
    .string()
    .transform((tags) => z.string().array().parse(JSON.parse(tags))),
});

export const postEmbededMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.iso.date(),
  og_image: z.string().nullish(),
  og_type: z.string().nullish(),
  publish: z.boolean(),
  tags: z.string().array(),
});

export const foldedRootSchema = z.object({
  folded: foldedInnerSchema,
  meta: postEmbededMetaSchema,
});

export type FoldedRoot = z.infer<typeof foldedRootSchema>;

export const postsSchema = postRecordSchema.array();

export const countSchema = z.object({ "COUNT(*)": z.number() });

export function parsePageNumber(page: string): number | null {
  try {
    const parsed = parseInt(page);
    if (parsed < 0) {
      return null;
    } else {
      return parsed;
    }
  } catch {
    return null;
  }
}
