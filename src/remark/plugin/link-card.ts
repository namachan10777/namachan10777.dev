// https://github.com/haxibami/haxibami.net/blob/main/src/lib/mdast-util-node-is.ts
import type { Root } from "mdast";
import type { Paragraph, Link, Text, Literal } from "mdast";
import type { Plugin } from "unified";
import type { Node } from "unist";
import { visit } from "unist-util-visit";

function isObject(node: unknown): node is Record<string, unknown> {
  return typeof node === "object" && node !== null;
}

function isNode(node: unknown): node is Node {
  return isObject(node) && "type" in node;
}

function isParagraph(node: unknown): node is Paragraph {
  return isNode(node) && node.type === "paragraph";
}

function isLink(node: unknown): node is Link {
  return isNode(node) && node.type === "link";
}

function isLiteral(node: unknown): node is Literal {
  return isObject(node) && "value" in node && "type" in node;
}

function isText(node: unknown): node is Text {
  return isLiteral(node) && node.type === "text";
}

function isIsolatedLink(node: unknown): node is Paragraph & {
  children: [Link & { children: [Text] }];
} {
  return (
    isParagraph(node) &&
    node.children.length === 1 &&
    isLink(node.children[0]) &&
    node.children[0].children.every(isText)
  );
}

function markIsolatedLink(tree: Root) {
  visit(tree, isIsolatedLink, (node) => {
    const link = node.children[0];
    link.data = {
      ...link.data,
      hProperties: {
        ...link.data?.hProperties,
        dataLinkCard: "true",
      },
    };
  });
}

const plugin: Plugin<[], Root> = () => {
  return markIsolatedLink;
};

export default plugin;
