import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const blog = await getCollection("blog");

export const GET: APIRoute = async (ctx) => {
  return rss({
    title: "namachan10777 Blog",
    description: "分散システム、ストレージ、Web、あとそのほか",
    site: ctx.site || "https://www.namachan10777.dev",
    items: blog
      .sort((a, b) => a.data.date.getTime() - b.data.date.getTime())
      .map((blog) => ({
        title: blog.data.title,
        pubDate: blog.data.date,
        description: blog.data.description,
        link: `/blog/${blog.slug}`,
      })),
  });
};
