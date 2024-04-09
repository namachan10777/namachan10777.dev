import { component$ } from "@builder.io/qwik";
import type { Root, Image, RootContent } from "mdast";
import type { WithTransformedImage } from "../../../content-collections";
import type * as hast from "hast";
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

class IdGenerator {
  id: number;
  map: Map<string, number>;
  constructor() {
    this.id = 0;
    this.map = new Map();
  }

  get(strId: string): number {
    const assigned = this.map.get(strId);
    if (assigned) {
      return assigned;
    } else {
      this.id += 1;
      this.map.set(strId, this.id);
      return this.id;
    }
  }
}

const MarkdownChildren = (props: {
  srcs: RootContent[];
  idGenerator: IdGenerator;
}) => {
  return (
    <>
      {props.srcs.map((child) => (
        <Markdown
          key={JSON.stringify(child.position)}
          src={child}
          idGenerator={props.idGenerator}
        />
      ))}
    </>
  );
};

const Markdown = ({
  src,
  idGenerator,
}: {
  src: RootContent | Section;
  idGenerator: IdGenerator;
}) => {
  switch (src.type) {
    case "text":
      return src.value;
    case "inlineCode":
      return <code class="mx-1 rounded-sm bg-gray-200 p-0.5">{src.value}</code>;
    case "footnoteReference":
      return (
        <sup>
          <a href={`#${src.identifier}`} class="mx-1 text-blue-600">
            [{idGenerator.get(src.identifier)}]
          </a>
        </sup>
      );
    case "section":
      return (
        <section class="flex flex-col gap-3">
          <MarkdownChildren srcs={src.children} idGenerator={idGenerator} />
        </section>
      );
    case "list":
      const listInner = src.children.map((item) => (
        <li key={JSON.stringify(item.position)}>
          <MarkdownChildren srcs={item.children} idGenerator={idGenerator} />
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
        <section class="flex flex-row gap-4">
          <header>
            <h3 class="" id={src.identifier}>
              {idGenerator.get(src.identifier)}
            </h3>
          </header>
          <div class="text-sm">
            <MarkdownChildren srcs={src.children} idGenerator={idGenerator} />
          </div>
        </section>
      );
    case "strong":
      return (
        <strong class="font-bold">
          <MarkdownChildren srcs={src.children} idGenerator={idGenerator} />
        </strong>
      );
    case "heading":
      const headingInner = src.children.map((child) => (
        <Markdown
          key={JSON.stringify(child.position)}
          src={child}
          idGenerator={idGenerator}
        />
      ));
      return (
        <div class="pb-1">
          <Heading level={src.depth == 1 ? 2 : src.depth}>
            {headingInner}
          </Heading>
        </div>
      );
    case "link":
      return (
        <a class="mx-0.5 text-blue-700 underline" href={src.url}>
          <MarkdownChildren srcs={src.children} idGenerator={idGenerator} />
        </a>
      );
    case "code":
      const styled = (src as unknown as { hast: hast.Root | undefined }).hast;
      return <Codeblock hast={styled} src={src.value} />;
    case "paragraph":
      return (
        <Typography>
          <MarkdownChildren srcs={src.children} idGenerator={idGenerator} />
        </Typography>
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
  const generator = new IdGenerator();
  return (
    <article class="flex flex-col gap-8">
      <MarkdownChildren srcs={src.children} idGenerator={generator} />
    </article>
  );
});
