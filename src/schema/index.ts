import typia from "typia";

export interface IsolatedLink {
  type: "isolated_link";
  title: string;
  description: string;
  url: string;
  image?: {
    url: string;
    width: number;
    height: number;
  } | null;
  favicon?: string | null;
}

export interface Heading {
  type: "heading";
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  slug: string;
}

export interface Codeblock {
  type: "codeblock";
  title?: string | null;
  content: string;
  lines: number;
}

export type Custom = IsolatedLink | Heading | Codeblock;

export type HtmlContent = {
  type: "html";
  content: string;
};

export type PartialContent = {
  type: "partial";
  children: FoldedTree[];
};

export type FoldedContent = HtmlContent | PartialContent;

export interface FoldedText {
  type: "text";
  text: string;
}

export interface FoldedHtml {
  type: "html";
  tag: string;
  attrs: Record<string, string | boolean>;
  id: string;
  content: FoldedContent;
}

export interface FoldedKeep {
  type: "keep";
  custom: Custom;
  id: string;
  content: FoldedContent;
}

export type FoldedTree = FoldedText | FoldedHtml | FoldedKeep;

export interface PostRecord {
  id: string;
  title: string;
  description: string;
  date: string;
  og_image: string | null;
  og_type: string | null;
  publish: 0 | 1;
  tags: string;
}

export const isPostRecord = typia.createIs<PostRecord>();
export const isPostRecords = typia.createIs<PostRecord[]>();
export const isTags = typia.createIs<string[]>();
export const isTagCount = typia.createIs<{ count: number; tag: string }[]>();

export interface PostMeta {
  id: string;
  title: string;
  description: string;
  date: string;
  og_image?: string | null;
  og_type?: string | null;
  publish: boolean;
  tags: string[];
}

export interface FoldedRoot {
  folded: FoldedContent;
  meta: PostMeta;
}

export const isFoldedRoot = typia.createIs<FoldedRoot>();

export interface CountRecord {
  count: number;
}

export const isCountRecord = typia.createIs<CountRecord>();

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
