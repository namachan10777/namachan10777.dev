import type { Compiler, Plugin } from "unified";
import * as hast from "hast";
import * as unist from "unist";
import rehypeStringify from "rehype-stringify";
import { toHtml } from "hast-util-to-html";
import { subtle } from "crypto";

function isNode(node: unknown): node is hast.Node {
  return typeof node === "object" && node !== null && "type" in node;
}

function isElement(node: hast.Node): node is hast.Element {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type === "element"
  );
}

function isText(node: hast.Node): node is hast.Text {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type === "text"
  );
}

function isComment(node: hast.Node): node is hast.Comment {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    node.type === "comment"
  );
}

declare module "unified" {
  interface CompilerResultMap {
    partial: Node;
  }
}

export type Node = Partial | Folded;

export interface Partial extends unist.Node {
  type: "partial";
  id: string;
  node: Element | Text | Comment;
  data?: unist.Data;
  children: Node[];
}

export interface Folded extends unist.Node {
  type: "folded";
  id: string;
  node: Element | Text | Comment;
  inner: string;
}

export interface Element {
  type: "element";
  tagName: string;
  properties: hast.Properties;
}

export interface Text {
  type: "text";
  value: string;
}

export interface Comment {
  type: "comment";
  value: string;
}

export type ProcessResult =
  | {
      type: "foldable";
      node: hast.Node;
    }
  | Partial;

function fold(node: hast.Node): Folded {
  const id = (inner: string) =>
    Bun.SHA256.hash(
      node.position ? JSON.stringify(node.position) : inner,
      "base64",
    );
  if (isElement(node)) {
    const inner = toHtml(node.children as hast.RootContent[]);
    return {
      type: "folded",
      id: id(inner),
      node: {
        type: "element",
        tagName: node.tagName,
        properties: node.properties,
      },
      inner,
    };
  } else if (isText(node)) {
    return {
      type: "folded",
      id: id(node.value),
      node: {
        type: "text",
        value: node.value,
      },
      inner: node.value,
    };
  } else if (isComment(node)) {
    return {
      type: "folded",
      id: id(node.value),
      node: {
        type: "comment",
        value: node.value,
      },
      inner: node.value,
    };
  } else {
    throw new Error(`Unsupported node type: ${node.type}`);
  }
}

function isMarkedAsKeep(node: hast.Node): boolean {
  return (
    node.data !== undefined &&
    "keep" in node.data &&
    typeof node.data.keep === "boolean" &&
    node.data.keep
  );
}

function process(node: hast.Node): ProcessResult {
  if (isElement(node)) {
    const hastChildren = node.children.map(process);
    const foldableChildren = hastChildren.every(
      (child) => child.type == "foldable",
    );

    if (foldableChildren && !isMarkedAsKeep(node)) {
      return {
        type: "foldable",
        node,
      };
    } else {
      const children = hastChildren.map((child) => {
        if (child.type === "foldable") {
          return fold(child.node);
        } else {
          return child;
        }
      });
      const partialHashSource = JSON.stringify({
        tagName: node.tagName,
        properties: node.properties,
        data: node.data,
        children: children.map((child) => child.id),
      });
      return {
        type: "partial",
        id: Bun.SHA256.hash(partialHashSource, "base64"),
        node: {
          type: "element",
          tagName: node.tagName,
          properties: node.properties,
        },
        data: node.data,
        children,
      };
    }
  } else {
    return {
      type: "foldable",
      node,
    };
  }
}

const rehypePartial: Plugin<[], hast.Node, Node> = function () {
  const compiler: Compiler<hast.Node, string> = (tree) => {
    const root = tree as hast.Root;
    const processed = root.children.map((content) => {
      const processed = process(content);
      return processed.type === "foldable" ? fold(processed.node) : processed;
    });
    return JSON.stringify(processed);
  };
  this.compiler = compiler;
};

export default rehypePartial;
