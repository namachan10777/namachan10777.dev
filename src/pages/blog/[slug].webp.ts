import { ogImage } from "@components/ogp/ogp";
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntryBySlug } from "astro:content";

export const getStaticPaths = (async () => {
  const blogs = await getCollection("blog");
  return blogs.map((blog) => ({ params: { slug: blog.slug } }));
}) satisfies GetStaticPaths;

const height = 630;
const width = 1200;

export const GET: APIRoute = async ({ params }) => {
  const article = await getEntryBySlug("blog", params.slug as string);

  const title = article?.data.title;
  const description = article?.data.description;
  const body = await ogImage({
    title: title || "No title",
    titleFontSize: 4,
    description,
    url: `https://namachan10777.dev/blog/${params.slug}`,
    width,
    height,
  });
  return new Response(body);
};
