import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntry } from "astro:content";
import { ogArticlePreviewSVG } from "ogp-image";

export const getStaticPaths = (async () => {
  const collection = await getCollection("post", (post) => post.data.publish);
  const posts = collection.map((post) => {
    const matched = /^(\d{4})\/(.+)$/.exec(post.id)!;
    const year = matched[1];
    const name = matched[2];
    return {
      params: { id: post.id },
      props: { year, name },
    };
  });
  return posts;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, site }) => {
  const post = (await getEntry("post", params.id!))!;
  return await ogArticlePreviewSVG({
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    url: `${site}/post/${post.id}`,
  });
};
