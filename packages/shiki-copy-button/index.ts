import type { ShikiTransformer } from "shiki";
import { getIconData } from "@iconify/utils";
import { icons, type IconifyJSON } from "@iconify-json/iconoir";
import type { ElementContent, Element } from "hast";
import { parse } from "svg-parser";

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

export function shikiCopyButton(): ShikiTransformer {
  return {
    pre: (hast) => {
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
      hast.children = [
        {
          type: "element",
          tagName: "button",
          properties: {
            class: "shiki-copy-button",
            "aria-label": "コードをコピーする",
          },
          children: [copy, check],
        },
        ...hast.children,
      ];
    },
  };
}
