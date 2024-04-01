import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkSectionize from "remark-sectionize";
import { unified } from "unified";
import type { Root } from "mdast";

export function parseMarkdown(src: string): Root {
  const mdast = unified().use(remarkParse).use(remarkGfm).parse(src);
  remarkSectionize()(mdast);
  return mdast;
}
