import { type RequestHandler } from "@builder.io/qwik-city";
import RSS from "rss";
import { frontmatters } from "~/lib/contents";

export const onGet: RequestHandler = async ({ request, send }) => {
  const url = new URL(request.url);
  const rss = new RSS({
    title: "namachan10777.dev",
    description: "namachan10777's personal website and blog",
    site_url: url.origin,
    feed_url: `${url.origin}/rss.xml`,
    language: "ja",
  });

  frontmatters.forEach((post) => {
    rss.item({
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      date: new Date(post.frontmatter.date),
      url: `/post/${post.id}/`,
      categories: post.frontmatter.tags || [],
    });
  });
  send(200, rss.xml());
};
