import type { APIRoute } from "astro";
import { ogArticlePreviewSVG } from "@lib/og";

export const GET: APIRoute = async ({ site }) => {
  return await ogArticlePreviewSVG({
    title: "posts",
    description: "namachan10777's posts",
    url: site!.toString(),
  });
};
