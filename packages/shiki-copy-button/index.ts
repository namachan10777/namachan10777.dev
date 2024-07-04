import { getIconData } from "@iconify/utils";
import { icons, type IconifyJSON } from "@iconify-json/iconoir";
import type { ElementContent, Element, Root } from "hast";
import { parse } from "svg-parser";
import { visit } from "unist-util-visit";

function iconSvgHast(icons: IconifyJSON, name: string): Element {
  const icon = getIconData(icons, name)!;
  const svg = parse(icon.body);
  return {
    type: "element",
    tagName: "svg",
    properties: {
      width: 24,
      height: 24,
      viewBox: `0 0 ${icon.width} ${icon.height}`,
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    children: svg.children as ElementContent[],
  };
}

function isObject(value: unknown): value is Object {
  return typeof value === "object" && value !== null;
}

function isElement(value: unknown): value is Element {
  return isObject(value) && "type" in value && value.type === "element";
}

function isFigure(value: unknown): value is Element & { tagName: "figure" } {
  return isElement(value) && value.tagName === "figure";
}

function isRehypePrettyCodeFigure(
  value: unknown
): value is Element & { tagName: "figure" } {
  return (
    isFigure(value) &&
    "properties" in value &&
    isObject(value.properties) &&
    "data-rehype-pretty-code-figure" in value.properties
  );
}

export function shikiCopyButton(): (root: Root) => void {
  return function (hast: Root) {
    visit(hast, isRehypePrettyCodeFigure, (figure, index, parent) => {
      const copy = iconSvgHast(icons, "copy");
      const check = iconSvgHast(icons, "check");
      copy.properties.class = [
        "shiki-copy-button-copy",
        "shiki-copy-button-icon",
      ].join(" ");
      check.properties.class = [
        "shiki-copy-button-check",
        "shiki-copy-button-icon",
      ].join(" ");
      figure.children = [
        {
          type: "element",
          tagName: "button",
          properties: {
            class: "shiki-copy-button",
            "aria-label": "コードをコピーする",
          },
          children: [copy, check],
        },
        ...figure.children,
      ];
    });
  };
}
