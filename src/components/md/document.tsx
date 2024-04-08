import { component$ } from "@builder.io/qwik";
import type { Root, Image, RootContent } from "mdast";
import type { WithTransformedImage } from "../../../content-collections";
import * as hast from "hast";
import { hastToHtml, bundledThemes } from "shiki";
import Codeblock from "./codeblock";
import Typography from "../display/typography";
import Heading from "../display/heading";

export type Props = {
  src: Root;
};

export interface Section extends Node {
  type: "section";
  children: RootContent[];
}

const Markdown = ({ src }: { src: RootContent | Section }) => {
  switch (src.type) {
    case "text":
      return src.value;
    case "inlineCode":
      return <code class="mx-1 rounded-sm bg-gray-200 p-0.5">{src.value}</code>;
    case "footnoteReference":
      return <sup>{src.identifier}</sup>;
    case "section":
      return (
        <section>
          {src.children.map((child) => (
            <Markdown key={JSON.stringify(child.position)} src={child} />
          ))}
        </section>
      );
    case "list":
      const listInner = src.children.map((item) => (
        <li key={JSON.stringify(item.position)}>
          {item.children.map((child) => (
            <Markdown key={JSON.stringify(child.position)} src={child} />
          ))}
        </li>
      ));
      if (src.ordered) {
        return <ol class="list-decimal pl-8 leading-snug">{listInner}</ol>;
      } else {
        return <ul class="list-disc pl-8 leading-snug">{listInner}</ul>;
      }
    case "thematicBreak":
      return <hr class="my-4 w-full border-gray-300" />;
    case "footnoteDefinition":
      return (
        <div>
          <sup>{src.identifier}</sup>
          {src.children.map((child) => (
            <Markdown key={JSON.stringify(child.position)} src={child} />
          ))}
        </div>
      );
    case "strong":
      return (
        <strong class="font-bold">
          {src.children.map((child) => (
            <Markdown src={child} key={JSON.stringify(child.position)} />
          ))}
        </strong>
      );
    case "heading":
      const headingInner = src.children.map((child) => (
        <Markdown key={JSON.stringify(child.position)} src={child} />
      ));
      return (
        <Heading level={src.depth == 1 ? 2 : src.depth}>{headingInner}</Heading>
      );
    case "link":
      return (
        <a class="mx-0.5 text-blue-700 underline" href={src.url}>
          {src.children.map((child) => (
            <Markdown src={child} key={JSON.stringify(child.position)} />
          ))}
        </a>
      );
    case "code":
      const styled = (src as unknown as { hast: hast.Root | undefined }).hast;
      return <Codeblock hast={styled} src={src.value} />;
    case "paragraph":
      return (
        <div class="my-4">
          <Typography>
            {src.children.map((child) => (
              <Markdown key={JSON.stringify(child.position)} src={child} />
            ))}
          </Typography>
        </div>
      );
    case "image": {
      const data = (
        src as unknown as (WithTransformedImage | undefined) & Image
      ).transformed;
      if (data) {
        const srcs = data.sort((a, b) => b.dim.w - a.dim.w);
        const srcset = srcs.map((src) => `${src.path} ${src.dim.w}w`).join(" ");
        return (
          <img
            loading="lazy"
            decoding="async"
            class="w-full max-w-full"
            src={srcs[0].path}
            width={srcs[0].dim.w}
            height={srcs[0].dim.h}
            srcset={srcset}
            alt={src.alt || undefined}
          />
        );
      } else {
        return <img src={src.url} alt={src.alt || undefined} />;
      }
    }
    default:
      return <span>Unknown type: {src.type}</span>;
  }
};

export default component$(({ src }: Props) => {
  return (
    <>
      {src.children.map((child) => (
        <Markdown key={JSON.stringify(child.position)} src={child} />
      ))}
    </>
  );
});
