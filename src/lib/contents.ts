import { JSXOutput } from '@builder.io/qwik';
import { z } from 'zod';

const frontmatterValidator = z.object({
  tags: z.array(z.string()),
  date: z.iso.date(),
  description: z.string(),
  title: z.string(),
  publish: z.boolean(),
});

const headValidator = z.object({
  title: z.string(),
  meta: z.array(z.object({
    name: z.string(),
    content: z.string(),
  })),
  styles: z.array(z.string()),
  links: z.array(z.string()),
  scripts: z.array(z.string()),
  frontmatter: z.object({
    tags: z.array(z.string()),
    date: z.iso.date(),
    publish: z.boolean(),
  }),
});

const headingsValidator = z.array(z.object({
  text: z.string(),
  id: z.string(),
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ])
}))

const validator = z.object({
  frontmatter: frontmatterValidator,
  headings: headingsValidator.nullish(),
  head: headValidator,
  default: z.unknown(),
});

export const pages = Object.fromEntries(Object.entries(import.meta.glob("./post/**/*.mdx", { eager: true })).map(([key, content]) => {
  const validated = validator.parse(content);
  const id = /(\d{4}\/.+)\.mdx$/.exec(key)![1];
  return [id, { ...validated, default: validated.default as () => JSXOutput}]
}));
