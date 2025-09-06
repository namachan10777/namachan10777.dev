import * as v from "valibot";

export type MarkdownNode<K> =
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
      children: MarkdownNode<K>[];
      hash: string;
    }
  | {
      type: "keep_eager";
      keep: K;
      content: string;
      hash: string;
    }
  | {
      type: "keep_lazy";
      keep: K;
      children: MarkdownNode<K>[];
      hash: string;
    };

export type MarkdownRoot<K> =
  | {
      type: "tree";
      children: MarkdownNode<K>[];
    }
  | {
      type: "html";
      content: string;
    };

export type AlertKind = "caution" | "important" | "note" | "warning" | "tip";

export interface Alert {
  type: "alert";
  kind: AlertKind;
}

export interface FootnoteReference {
  type: "footnote_reference";
  id: string;
  reference: number | null;
  content: number | null;
}

export interface LinkCardImage {
  src: string;
  width: number;
  height: number;
  content_type: string;
}

export interface LinkCard {
  type: "link_card";
  href: string;
  title: string;
  description: string;
  favicon: LinkCardImage | null;
  og_image: LinkCardImage | null;
}

export interface Codeblock {
  type: "codeblock";
  lang: string | null;
  title: string | null;
  lines: number;
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface Heading {
  type: "heading";
  level: HeadingLevel;
  slug: string;
}

export interface Image<S> {
  type: "image";
  alt: string;
  blurhash: string | null;
  width: number;
  height: number;
  content_type: string;
  storage: S;
}

export interface R2ImageStorage {
  type: "r2";
  bucket: string;
  key: string;
}

export type ImageStorage = R2ImageStorage;

export type R2StoragePointer = {
  type: "r2";
  bucket: string;
  key: string;
};

export const r2StoragePointer = v.object({
  type: v.literal("r2"),
  bucket: v.string(),
  key: v.string(),
});

export type KvStoragePointer = {
  type: "kv";
  namespace: string;
  key: string;
};

export const kvStoragePointer = v.object({
  type: v.literal("kv"),
  namespace: v.string(),
  key: v.string(),
});

export interface AssetStoragePointer {
  type: "asset";
  path: string;
}

export const assetStoragePointer = v.object({
  type: v.literal("asset"),
  path: v.string(),
});

export type StoragePointer =
  | R2StoragePointer
  | KvStoragePointer
  | AssetStoragePointer;

export const storagePointer = v.union([
  r2StoragePointer,
  kvStoragePointer,
  assetStoragePointer,
]);

export interface ImageColumn<S> {
  width: number;
  height: number;
  content_type: string;
  blurhash: null | string;
  hash: string;
  pointer: S;
}

export function imageColumn<S extends v.GenericSchema<StoragePointer>>(
  pointer: S,
) {
  return v.object({
    width: v.number(),
    height: v.number(),
    content_type: v.string(),
    blurhash: v.nullable(v.string()),
    hash: v.string(),
    pointer,
  });
}

export interface FootnoteDefinition<K> {
  id: string;
  reference: number | null;
  content: MarkdownRoot<K>;
}

export interface MarkdownSection {
  id: string;
  level: HeadingLevel;
  title: string;
  content: string;
}

export interface MarkdownDocument<F, K> {
  frontmatter: F;
  footnotes: FootnoteDefinition<K>[];
  sections: MarkdownSection[];
  root: MarkdownRoot<K>;
}

export interface MarkdownKvStorageColumn {
  type: "kv";
  hash: string;
  key: string;
  pointer: KvStoragePointer;
}

export interface MarkdownInlineStorageColumn<K> {
  type: "inline";
  content: {
    footnotes: FootnoteDefinition<K>[];
    sections: MarkdownSection[];
    root: MarkdownRoot<K>;
  };
  hash: string;
}

export const markdownKvStorageColumn = v.object({
  type: v.literal("kv"),
  hash: v.string(),
  key: v.string(),
  pointer: kvStoragePointer,
});

export interface FileStorageColumn<S> {
  size: number;
  content_type: string;
  pointer: S;
  hash: string;
}

export function fileStorage<S extends v.GenericSchema<StoragePointer>>(
  pointer: S,
) {
  return v.object({
    size: v.number(),
    content_type: v.string(),
    pointer,
    hash: v.string(),
  });
}
