import * as v from "valibot";
import * as rudis from "./rudis";
import type { DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_IMG_SRC_TYPES } from "react";
import type { TextInsertion } from "typescript";

export function markdownNode<TInput = unknown, TOutput = TInput>(
  keep: v.GenericSchema<TInput, TOutput>,
): v.GenericSchema<rudis.MarkdownNode<TInput>, rudis.MarkdownNode<TOutput>> {
  const schema: v.GenericSchema<
    rudis.MarkdownNode<TInput>,
    rudis.MarkdownNode<TOutput>
  > = v.lazy(() => {
    const attrs = v.record(
      v.string(),
      v.union([v.number(), v.string(), v.boolean()]),
    );
    const textNode = v.object({
      type: v.literal("text"),
      text: v.string(),
      hash: v.string(),
    });
    const eagerNode = v.object({
      type: v.literal("eager"),
      tag: v.string(),
      attrs: attrs,
      content: v.string(),
      hash: v.string(),
    });
    const lazyNode = v.object({
      type: v.literal("lazy"),
      tag: v.string(),
      attrs,
      children: v.array(schema),
      hash: v.string(),
    });
    const keepEagerNode = v.object({
      type: v.literal("keep_eager"),
      keep,
      content: v.string(),
      hash: v.string(),
    });
    const keepLazyNode = v.object({
      type: v.literal("keep_lazy"),
      keep,
      children: v.array(schema),
      hash: v.string(),
    });
    return v.union([
      textNode,
      eagerNode,
      lazyNode,
      keepEagerNode,
      keepLazyNode,
    ]);
  });
  return schema;
}

export function markdownRoot<TInput, TOutput = TInput>(
  keep: v.GenericSchema<TInput, TOutput>,
): v.GenericSchema<rudis.MarkdownRoot<TInput>, rudis.MarkdownRoot<TOutput>> {
  return v.union([
    v.object({
      type: v.literal("tree"),
      children: v.array(markdownNode(keep)),
    }),
    v.object({
      type: v.literal("html"),
      content: v.string(),
    }),
  ]);
}

export const alertKind = v.union([
  v.literal("caution"),
  v.literal("important"),
  v.literal("note"),
  v.literal("warning"),
  v.literal("tip"),
]);

export const alertKeep = v.object({
  type: v.literal("alert"),
  kind: alertKind,
});

export const footnoteReferenceKeep = v.object({
  type: v.literal("footnote_reference"),
  id: v.string(),
  reference: v.nullable(v.number()),
  content: v.nullable(v.string()),
});

export const linkCardImage = v.object({
  src: v.string(),
  width: v.number(),
  height: v.number(),
  content_type: v.string(),
});

export const linkCardKeep = v.object({
  type: v.literal("link_card"),
  href: v.string(),
  title: v.string(),
  description: v.string(),
  favicon: v.nullable(linkCardImage),
  og_image: v.nullable(linkCardImage),
});

export const codeblockKeep = v.object({
  type: v.literal("codeblock"),
  lang: v.nullable(v.string()),
  title: v.nullable(v.string()),
  lines: v.number(),
});

export const headingLevel = v.union([
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4),
  v.literal(5),
  v.literal(6),
]);

export const headingKeep = v.object({
  type: v.literal("heading"),
  level: headingLevel,
  slug: v.string(),
});

export function imageKeep<TInput, TOutput = TInput>(
  storage: v.GenericSchema<TInput, TOutput>,
): v.GenericSchema<rudis.ImageKeep<TInput>, rudis.ImageKeep<TOutput>> {
  return v.object({
    type: v.literal("image"),
    alt: v.string(),
    blurhash: v.nullable(v.string()),
    width: v.number(),
    height: v.number(),
    content_type: v.string(),
    storage,
  });
}

export function footnoteDefinition<TInput, TOutput = TInput>(
  keep: v.GenericSchema<TInput, TOutput>,
): v.GenericSchema<
  rudis.FootnoteDefinition<TInput>,
  rudis.FootnoteDefinition<TOutput>
> {
  return v.object({
    id: v.string(),
    reference: v.nullable(v.number()),
    content: markdownRoot(keep),
  });
}

export const markdownSection = v.object({
  id: v.string(),
  level: headingLevel,
  title: v.string(),
  content: v.string(),
});

export function markdownDocument<
  FInput,
  KInput,
  FOutput = FInput,
  KOutput = KInput,
>(
  frontmatter: v.GenericSchema<FInput, FOutput>,
  keep: v.GenericSchema<KInput, KOutput>,
): v.GenericSchema<
  rudis.MarkdownDocument<FInput, KInput>,
  rudis.MarkdownDocument<FOutput, KOutput>
> {
  return v.object({
    frontmatter,
    footnotes: v.array(footnoteDefinition(keep)),
    sections: v.array(markdownSection),
    root: markdownRoot(keep),
  });
}

export const r2StoragePointer = v.object({
  type: v.literal("r2"),
  bucket: v.string(),
  key: v.string(),
});

export const kvStoragePointer = v.object({
  type: v.literal("kv"),
  namespace: v.string(),
  key: v.string(),
});

export const assetStoragePointer = v.object({
  type: v.literal("asset"),
  path: v.string(),
});

export const inlineStoragePointer = v.object({
  type: v.literal("inline"),
  content: v.string(),
  base64: v.boolean(),
});

export const storagePointer = v.union([
  r2StoragePointer,
  kvStoragePointer,
  assetStoragePointer,
  inlineStoragePointer,
]);

export function objectReference<
  MInput,
  SInput,
  MOutput = MInput,
  SOutput = SInput,
>(
  meta: v.GenericSchema<MInput, MOutput>,
  pointer: v.GenericSchema<SInput, SOutput>,
): v.GenericSchema<
  rudis.ObjectReference<MInput, SInput>,
  rudis.ObjectReference<MOutput, SOutput>
> {
  return v.object({
    hash: v.string(),
    size: v.number(),
    content_type: v.string(),
    meta,
    pointer,
  });
}

export const imageReferenceMeta = v.object({
  width: v.number(),
  height: v.number(),
  blurhash: v.nullable(v.string()),
  derived_id: v.string(),
});

export function markdownReference<SInput, SOutput = SInput>(
  pointer: v.GenericSchema<SInput, SOutput>,
): v.GenericSchema<
  rudis.ObjectReference<null, SInput>,
  rudis.ObjectReference<null, SOutput>
> {
  return objectReference(v.null(), pointer);
}

export function fileReference<SInput, SOutput = SInput>(
  pointer: v.GenericSchema<SInput, SOutput>,
): v.GenericSchema<
  rudis.ObjectReference<null, SInput>,
  rudis.ObjectReference<null, SOutput>
> {
  return objectReference(v.null(), pointer);
}

export function imageReference<SInput, SOutput = SInput>(
  pointer: v.GenericSchema<SInput, SOutput>,
): v.GenericSchema<
  rudis.ObjectReference<rudis.ImageReferenceMeta, SInput>,
  rudis.ObjectReference<rudis.ImageReferenceMeta, SOutput>
> {
  return objectReference(imageReferenceMeta, pointer);
}
