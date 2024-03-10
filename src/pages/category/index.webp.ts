import { ogImage } from "@components/ogp/ogp";
import type { APIRoute } from "astro";

const height = 630;
const width = 1200;

export const GET: APIRoute = async () => {
  const body = await ogImage({
    title: `Categories`,
    url: `https://namachan10777.dev/category/`,
    width,
    height,
  });
  return new Response(body);
};
