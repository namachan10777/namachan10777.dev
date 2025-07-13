import type * as mdast from "mdast";
import { visit } from "unist-util-visit";
import type * as mdxMdast from "mdast-util-mdx";

export default function remarkQwikImage() {
  return (root: mdast.Root) => {
    const imports: mdast.RootContent[] = [];
    let counter = 0;
    visit(root, "image", (node) => {
      const componentName = `_InsertedImage${counter++}`;
      const importStatement: mdast.RootContent = {
        type: "mdxjsEsm",
        value: `import ${componentName} from "${node.url}?jsx"`,
        data: {
          estree: {
            type: "Program",
            body: [
              {
                type: "ImportDeclaration",
                attributes: [],
                specifiers: [
                  {
                    type: "ImportDefaultSpecifier",
                    local: { type: "Identifier", name: componentName },
                  },
                ],
                source: { type: "Literal", value: `${node.url}?jsx` },
              },
            ],
            sourceType: "module",
          },
        },
      };
      imports.push(importStatement);
      const slot = node as unknown as mdxMdast.MdxJsxFlowElement;
      slot.type = "mdxJsxFlowElement";
      slot.name = componentName;
      slot.attributes = [];
      slot.children = [];
    });
    root.children = [...imports, ...root.children];
  };
}
