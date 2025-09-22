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

export interface AlertKeep {
  type: "alert";
  kind: AlertKind;
}

export interface FootnoteReferenceKeep {
  type: "footnote_reference";
  id: string;
  reference: number | null;
  content: string | null;
}

export interface LinkCardImage {
  src: string;
  width: number;
  height: number;
  content_type: string;
}

export interface LinkCardKeep {
  type: "link_card";
  href: string;
  title: string;
  description: string;
  favicon: LinkCardImage | null;
  og_image: LinkCardImage | null;
}

export interface CodeblockKeep {
  type: "codeblock";
  lang: string | null;
  title: string | null;
  lines: number;
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingKeep {
  type: "heading";
  level: HeadingLevel;
  slug: string;
}

export interface ImageKeep<S> {
  type: "image";
  alt: string;
  blurhash: string | null;
  width: number;
  height: number;
  content_type: string;
  storage: S;
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

export type R2StoragePointer = {
  type: "r2";
  bucket: string;
  key: string;
};

export type KvStoragePointer = {
  type: "kv";
  namespace: string;
  key: string;
};

export interface AssetStoragePointer {
  type: "asset";
  path: string;
}

export interface InlineStoragePointer {
  type: "inline";
  content: string;
  base64: boolean;
}

export type StoragePointer =
  | R2StoragePointer
  | KvStoragePointer
  | AssetStoragePointer
  | InlineStoragePointer;

export interface ObjectReference<M, S> {
  hash: string;
  size: number;
  content_type: string;
  meta: M;
  pointer: S;
}

export interface ImageReferenceMeta {
  width: number;
  height: number;
  blurhash: string | null;
  derived_id: string;
}

export type ImageReference<S> = ObjectReference<ImageReferenceMeta, S>;

export type FileReference<S> = ObjectReference<null, S>;
export type MarkdownReference<S> = ObjectReference<null, S>;
