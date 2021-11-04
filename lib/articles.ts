import index from "../articles/index.md";
import blogOnNextJs from "../articles/blog/blog-on-nextjs.md";
import cigarettes from "../articles/blog/cigarettes.md";
import { Article, Diary, parse, parseDiary } from "./parser";
import diary20210914 from "../articles/diary/2021-09-14.md";
import diary20210921 from "../articles/diary/2021-09-21.md";

export const rawArticles = {
  index,
  blogs: [blogOnNextJs, cigarettes],
  diaries: [diary20210914, diary20210921],
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
