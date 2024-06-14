import { ogArticlePreviewSVG } from "@lib/og";
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

export const getStaticPaths = (async () => {
  const posts = await getCollection("post");
  const tags = new Set(posts.flatMap((post) => post.data.tags));
  return [...tags].map((tag) => ({
    params: {
      tag,
    },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, site }) => {
  const posts = await getCollection("post", (post) =>
    post.data.tags.includes(params.tag!),
  );
  return await ogArticlePreviewSVG({
    title: params.tag!,
    description: posts
      .map((post) => post.data.title)
      .slice(0, Math.min(posts.length, 8)),
    date: posts
      .map((post) => post.data.date)
      .reduce((a, b) => (a.getDate() > b.getDate() ? a : b)),
    url: `${site}/post/tag/${params.tag!}`,
  });
};
