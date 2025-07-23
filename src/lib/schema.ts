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
    inner: z.string(),
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
    image_url: z.string(),
  }),
]);

export type HtmlContent = {
  type: "html";
  inner: string;
};
export type PartialContent = {
  type: "partial";
  inner: FoldedTree[];
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
  inner: FoldedContent;
};

export type Custom = z.infer<typeof custom>;

export type FoldedKeep = {
  type: "keep";
  custom: Custom;
  id: string;
  inner: FoldedContent;
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
    inner: foldedInnerSchema,
  });
  const keep: z.Schema<FoldedKeep> = z.object({
    type: z.literal("keep"),
    custom,
    id: z.string(),
    inner: foldedInnerSchema,
  });
  const innerHtml: z.Schema<HtmlContent> = z.object({
    type: z.literal("html"),
    inner: z.string(),
  });
  const innerPartial: z.Schema<PartialContent> = z.object({
    type: z.literal("partial"),
    inner: z.union([text, html, keep]).array(),
  });

  return z.union([innerHtml, innerPartial]);
});

export const foldedRootSchema = z.object({
  folded: foldedInnerSchema,
  meta: z.object({
    title: z.string(),
    description: z.string(),
    date: z.iso.date(),
    tags: z.string().array(),
    og_image: z.string().nullish(),
  }),
});

export type FoldedRoot = z.infer<typeof foldedRootSchema>;
