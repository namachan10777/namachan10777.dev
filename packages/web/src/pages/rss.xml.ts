import rss, { type RSSFeedItem } from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const posts: RSSFeedItem[] = (
  await getCollection("post", (post) => post.data.publish)
)
  .sort((a, b) => a.data.date.getTime() - b.data.date.getTime())
  .map((post) => ({
    title: post.data.title,
    pubDate: post.data.date,
    description: post.data.description,
    link: `/post/${post.slug}`,
  }));

export const GET: APIRoute = (ctx) => {
  return rss({
    title: "namachan10777.dev",
    description: "namachan10777.dev",
    site: ctx.site!,
    items: posts,
  });
};
