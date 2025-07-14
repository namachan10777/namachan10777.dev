import type * as hast from "hast";
import { visit } from "unist-util-visit";

function editFigureParagraph(paragraph: hast.Element) {
  paragraph.tagName = "div";
  const children: hast.ElementContent[] = [];
  for (const child of paragraph.children) {
    if (
      child.type === "mdxJsxFlowElement" &&
      child.data &&
      "type" in child.data &&
      child.data.type === "inserted-image"
    ) {
      const metaRef = child as unknown as {
        title?: string;
        alt: string;
      };
      children.push({
        type: "element",
        tagName: "figure",
        properties: {},
        children: [
          child,
          {
            type: "element",
            tagName: "figcaption",
            properties: {},
            children: [
              {
                type: "text",
                value: metaRef.title || metaRef.alt,
              },
            ],
          },
        ],
      });
    } else {
      children.push(child);
    }
  }
  paragraph.children = children;
}

export default function rehypeAddCaptions() {
  return (tree: hast.Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "p" && node.children.length > 0) {
        editFigureParagraph(node);
      }
    });
  };
}
