import type * as hast from "hast";
import { visit } from "unist-util-visit";

export default function rehypeCodeAttrs() {
  return (node: hast.Root) => {
    visit(node, "element", (code, index, parent) => {
      if (!parent || index === undefined || code.tagName !== "code") {
        return;
      }

      if (parent.type !== "element" || parent.tagName !== "pre") {
        return;
      }

      const lines =
        code.children.length === 1 && code.children[0].type === "text"
          ? code.children[0].value.split("\n").length - 1
          : code.children.filter(
              (tag) => tag.type === "element" && tag.tagName === "span",
            ).length;

      const data = { lines, attrs: {} };
      if (code?.data?.meta) {
        const attrs: Record<string, string | boolean> = Object.fromEntries(
          code.data.meta.split(/[ \t]+/).map((attr) => {
            const match = /^([^=]+)=(.+)$/.exec(attr.trim());
            if (match) {
              return [match[1], match[2]];
            } else {
              return [attr, true];
            }
          }),
        );
        data.attrs = attrs;
      }
      parent.properties.data = JSON.stringify(data);
    });
  };
}
