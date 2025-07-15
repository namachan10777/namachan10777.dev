import { Component, JSXOutput } from "@builder.io/qwik";
import { z } from "zod";

const frontmatterValidator = z.object({
  tags: z.array(z.string()),
  date: z.iso.date(),
  description: z.string(),
  title: z.string(),
  publish: z.boolean(),
});

const headValidator = z.object({
  title: z.string(),
  meta: z.array(
    z.object({
      name: z.string(),
      content: z.string(),
    }),
  ),
  styles: z.array(z.string()),
  links: z.array(z.string()),
  scripts: z.array(z.string()),
  frontmatter: z.object({
    tags: z.array(z.string()),
    date: z.iso.date(),
    publish: z.boolean(),
  }),
});

const headingsValidator = z.array(
  z.object({
    text: z.string(),
    id: z.string(),
    level: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ]),
  }),
);

const validator = z.object({
  frontmatter: frontmatterValidator,
  headings: headingsValidator.nullish(),
  head: headValidator,
  default: z.unknown(),
});

export interface MdxComponents {
  pre?: Component<unknown>;
}

export interface MdxProps {
  components?: MdxComponents;
}

export const pages = Object.fromEntries(
  Object.entries(import.meta.glob("./post/**/*.mdx", { eager: true })).map(
    ([key, content]) => {
      const validated = validator.parse(content);
      const id = /(\d{4}\/.+)\.mdx$/.exec(key)![1];
      return [
        id,
        {
          ...validated,
          default: validated.default as (props: MdxProps) => JSXOutput,
        },
      ];
    },
  ),
);

export const frontmatters = Object.entries(pages)
  .map(([id, content]) => ({
    id,
    frontmatter: content.frontmatter,
  }))
  .filter((post) => post.frontmatter.publish);
frontmatters.sort(
  (a, b) =>
    new Date(b.frontmatter.date).getTime() -
    new Date(a.frontmatter.date).getTime(),
);

export interface Page<T> {
  contents: T[];
  current: number;
  prev?: number;
  next?: number;
}

export function paginate<T>(pages: T[], pageSize: number): Page<T>[] {
  const totalPages = Math.ceil(pages.length / pageSize);
  const result = Array.from({ length: totalPages }, (_, index) => {
    const start = index * pageSize;
    const end = start + pageSize;
    return pages.slice(start, end);
  });
  return result.map((contents, index) => ({
    contents,
    current: index + 1,
    prev: index > 0 ? index : undefined,
    next: index < totalPages - 1 ? index + 2 : undefined,
  }));
}
