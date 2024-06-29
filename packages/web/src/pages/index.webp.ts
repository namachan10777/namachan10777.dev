import type { APIRoute } from "astro";
import { ogArticlePreviewSVG } from "ogp-image";

export const GET: APIRoute = async ({ site }) => {
  return await ogArticlePreviewSVG({
    title: "namachan10777.dev",
    description: "posts and profile",
    url: site!.toString(),
  });
};
