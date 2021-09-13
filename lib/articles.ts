import index from '../articles/index.md';
import blogOnNextJs from '../articles/blog/blog-on-nextjs.md';
import cigarettes from '../articles/blog/cigarettes.md';
import { Article, parse } from './parser';

export const rawArticles = {
  index,
  blogs: [blogOnNextJs, cigarettes],
};

export type Articles = {
  index: Article,
  blogs: { [key: string]: Article },
};

export default async function articles(): Promise<Articles> {
  const ret: Articles = { index: await parse(rawArticles.index), blogs: {} };
  const blogs = await Promise.all(rawArticles.blogs.map(parse));
  blogs.forEach((article) => {
    ret.blogs[article.frontmatter.name] = article;
  });
  return ret;
};
