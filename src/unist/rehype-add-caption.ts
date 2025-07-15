import type * as hast from "hast";
import { MdxJsxFlowElement } from "mdast-util-mdx";
import { MdxJsxFlowElementHast } from "mdast-util-mdx-jsx";
import { visit } from "unist-util-visit";

function foldNonFigureContent(stack: hast.ElementContent[]) {
  const children: hast.ElementContent[] = [];
  while (true) {
    const last = stack.pop();
    if (last === undefined) {
      break;
    }
    if (last.type === "element" && last.tagName == "figure") {
      stack.push(last);
      break;
    }
  }
  if (children.length > 0) {
    stack.push({
      type: "element",
      tagName: "p",
      properties: {},
      children,
    });
  }
}

function editFigureParagraph(paragraph: hast.Element) {
  paragraph.tagName = "div";
  const children: hast.ElementContent[] = [];
  for (const child of paragraph.children) {
    if (isInsertedImage(child)) {
      const metaRef = child as unknown as {
        title?: string;
        alt: string;
      };

      foldNonFigureContent(children);

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
  foldNonFigureContent(children);
  paragraph.children = children;
}

function isInsertedImage(
  node: hast.ElementContent,
): node is MdxJsxFlowElementHast {
  return (
    node.type === "mdxJsxFlowElement" &&
    node.data !== undefined &&
    "type" in node.data &&
    node.data.type === "inserted-image"
  );
}

export default function rehypeAddCaptions() {
  return (tree: hast.Root) => {
    visit(tree, "element", (node) => {
      if (
        node.tagName === "p" &&
        node.children.filter(isInsertedImage).length > 0
      ) {
        editFigureParagraph(node);
      }
    });
  };
}
