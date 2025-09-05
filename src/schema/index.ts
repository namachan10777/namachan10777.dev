import * as v from "valibot";

const linkCardImage = v.object({
  src: v.string(),
  width: v.number(),
  height: v.number(),
  content_type: v.string(),
});

export type LinkCardImage = v.InferOutput<typeof linkCardImage>;

export const codeblock = v.object({
  type: v.literal("codeblock"),
  lang: v.nullable(v.string()),
  title: v.nullable(v.string()),
  lines: v.number(),
});

export type Codeblock = v.InferOutput<typeof codeblock>;

export const heading = v.object({
  type: v.literal("heading"),
  level: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(6)),
  slug: v.string(),
});

export type Heading = v.InferOutput<typeof heading>;

export const image = v.object({
  type: v.literal("image"),
  blurhash: v.nullable(v.string()),
  alt: v.string(),
  width: v.number(),
  height: v.number(),
  content_type: v.string(),
  storage: v.object({
    type: v.literal("r2"),
    bucket: v.string(),
    key: v.string(),
  }),
});

export type Image = v.InferOutput<typeof image>;

export const link_card = v.object({
  type: v.literal("link_card"),
  href: v.string(),
  title: v.string(),
  description: v.string(),
  favicon: v.nullable(linkCardImage),
  og_image: v.nullable(linkCardImage),
});

export type LinkCard = v.InferOutput<typeof link_card>;

export const alert = v.object({
  type: v.literal("alert"),
  kind: v.union([
    v.literal("caution"),
    v.literal("important"),
    v.literal("note"),
    v.literal("warning"),
    v.literal("tip"),
  ]),
});

export type Alert = v.InferOutput<typeof alert>;

export const footnoteReference = v.object({
  type: v.literal("footnote_reference"),
});

export type FootnoteReference = v.InferOutput<typeof footnoteReference>;

const keep = v.union([
  codeblock,
  heading,
  image,
  link_card,
  alert,
  footnoteReference,
]);

export type Keep = v.InferOutput<typeof keep>;

export type Tree =
  | {
      type: "text";
      text: string;
      hash: string;
    }
  | {
      type: "eager";
      tag: string;
      attrs: Record<string, string | number | boolean>;
      content: string;
      hash: string;
    }
  | {
      type: "lazy";
      tag: string;
      attrs: Record<string, string | number | boolean>;
      children: Tree[];
      hash: string;
    }
  | {
      type: "keep_eager";
      keep: Keep;
      content: string;
      hash: string;
    }
  | {
      type: "keep_lazy";
      keep: Keep;
      children: Tree[];
      hash: string;
    };

const tree: v.GenericSchema<Tree> = v.union([
  v.object({
    type: v.literal("eager"),
    tag: v.string(),
    attrs: v.record(v.string(), v.union([v.string(), v.number(), v.boolean()])),
    content: v.string(),
    hash: v.string(),
  }),
  v.object({
    type: v.literal("lazy"),
    tag: v.string(),
    attrs: v.record(v.string(), v.union([v.string(), v.number(), v.boolean()])),
    children: v.array(v.lazy(() => tree)),
    hash: v.string(),
  }),
  v.object({
    type: v.literal("keep_eager"),
    keep: keep,
    content: v.string(),
    hash: v.string(),
  }),
  v.object({
    type: v.literal("keep_lazy"),
    keep: keep,
    children: v.array(v.lazy(() => tree)),
    hash: v.string(),
  }),
]);

const imageReference = v.object({
  blurhash: v.nullable(v.string()),
  width: v.number(),
  height: v.number(),
  content_type: v.string(),
  pointer: v.object({
    type: v.literal("r2"),
    bucket: v.string(),
    key: v.string(),
  }),
});

export const root = v.union([
  v.object({
    type: v.literal("tree"),
    children: v.array(tree),
  }),
  v.object({
    type: v.literal("html"),
    content: v.string(),
  }),
]);

export type Root = v.InferOutput<typeof root>;

export const footnote = v.object({
  id: v.string(),
  reference: v.nullable(v.union([v.string(), v.number()])),
  content: root,
});

export type Footnote = v.InferOutput<typeof footnote>;

export const post = v.object({
  frontmatter: v.object({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    date: v.string(),
    publish: v.boolean(),
    og_image: v.nullable(imageReference),
    tags: v.array(
      v.object({
        tag: v.string(),
      }),
    ),
  }),
  footnotes: v.array(footnote),
  sections: v.array(
    v.object({
      id: v.string(),
      level: v.union([
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
        v.literal(5),
        v.literal(6),
      ]),
      title: v.string(),
      content: v.string(),
    }),
  ),
  root,
});
export type Post = v.InferOutput<typeof post>;

export const markdownReference = v.object({});

export type D1Result<R> = {
  results: R[];
  success: true;
};

export function d1Result<T>(
  schema: v.GenericSchema<T>,
): v.GenericSchema<D1Result<T>> {
  return v.object({
    results: v.array(schema),
    success: v.literal(true),
  });
}

export const postRecord = v.object({
  id: v.string(),
  body: v.pipe(
    v.string(),
    v.transform((json) => JSON.parse(json)),
    markdownReference,
  ),
  title: v.string(),
  description: v.string(),
  date: v.pipe(
    v.string(),
    v.transform((date) => new Date(date)),
  ),
  publish: v.pipe(
    v.number(),
    v.transform((flag) => flag === 1),
  ),
  tags: v.pipe(
    v.string(),
    v.transform((tags) => JSON.parse(tags)),
    v.array(v.string()),
  ),
  hash: v.string(),
  og_image: v.pipe(
    v.nullable(v.string()),
    v.transform((json) => json && JSON.parse(json)),
    v.nullable(imageReference),
  ),
});
