import { Article, Diary, parse, parseDiary } from "./parser";
import { index, blogs, diaries } from "./generated/articles";

export const rawArticles = {
  index,
  blogs,
  diaries,
};

export type Articles = {
  index: Article;
  blogs: { [key: string]: Article };
  diaries: { [key: string]: Diary };
};

export default async function articles(): Promise<Articles> {
  const ret: Articles = {
    index: await parse(rawArticles.index),
    blogs: {},
    diaries: {},
  };
  const blogs = await Promise.all(rawArticles.blogs.map(parse));
  blogs.forEach((article) => {
    ret.blogs[article.frontmatter.name] = article;
  });
  const diaries = await Promise.all(rawArticles.diaries.map(parseDiary));
  diaries.forEach((diary) => {
    ret.diaries[diary.frontmatter.date.toString()] = diary;
  });
  return ret;
}
