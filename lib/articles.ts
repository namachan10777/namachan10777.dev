import index from '../articles/index.md';
import blogOnNextJs from '../articles/blog/blog-on-nextjs.md';
import cigarettes from '../articles/blog/cigarettes.md';
import { Article, Diary, parse, parse_diary } from './parser';
import diary2021_09_14 from '../articles/diary/2021-09-14.md';
import diary2021_09_21 from '../articles/diary/2021-09-21.md';

export const rawArticles = {
  index,
  blogs: [blogOnNextJs, cigarettes],
  diaries: [diary2021_09_14, diary2021_09_21],
};

export type Articles = {
  index: Article,
  blogs: { [key: string]: Article },
  diaries: { [key: string]: Diary },
};

export default async function articles(): Promise<Articles> {
  const ret: Articles = { index: await parse(rawArticles.index), blogs: {}, diaries: {} };
  const blogs = await Promise.all(rawArticles.blogs.map(parse));
  blogs.forEach((article) => {
    ret.blogs[article.frontmatter.name] = article;
  });
  const diaries = await Promise.all(rawArticles.diaries.map(parse_diary));
  diaries.forEach((diary) => {
    ret.diaries[diary.frontmatter.date.toString()] = diary;
  });
  return ret;
};
