import { ogImage } from "@components/ogp/ogp";
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

export const getStaticPaths = (async () => {
  const blogs = await getCollection("blog");
  const categories = [
    ...new Set(blogs.flatMap((blog) => blog.data.category)).values(),
  ];
  return categories.map((category) => ({
    params: {
      category,
    },
  }));
}) satisfies GetStaticPaths;

const height = 630;
const width = 1200;

export const GET: APIRoute = async ({ params }) => {
  const body = await ogImage({
    title: `#${params.category}`,
    url: `https://namachan10777.dev/category/${params.category}`,
    width,
    height,
  });
  return new Response(body);
};
