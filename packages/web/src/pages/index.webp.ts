import { ogArticlePreviewSVG } from "@lib/og";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ site }) => {
  return await ogArticlePreviewSVG({
    title: "namachan10777.dev",
    description: "posts and profile",
    url: site!.toString(),
  });
};
