import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntry } from "astro:content";
import { ogArticlePreviewSVG } from "@lib/og";

export const getStaticPaths = (async () => {
  const collection = await getCollection("post");
  const posts = collection.map((post) => {
    const [_, year, name] = /^(\d{4})\/(.+)$/.exec(post.slug)!;
    return {
      params: { slug: post.slug },
      props: { year, name },
    };
  });
  return posts;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, site }) => {
  const post = (await getEntry("post", params.slug!))!;
  return await ogArticlePreviewSVG({
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    url: `${site}/post/${post.slug}`,
  });
};
