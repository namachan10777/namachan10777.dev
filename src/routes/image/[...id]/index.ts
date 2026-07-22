import type { LoaderFunctionArgs } from "react-router";
import * as v from "valibot";
import { logServerError } from "~/lib/server-log";

const allowedWidths = new Set([400, 800, 1200, 1600]);
const formatValidator = v.union([
  v.literal("avif"),
  v.literal("webp"),
  v.literal("json"),
  v.literal("jpeg"),
  v.literal("png"),
  v.literal("baseline-jpeg"),
  v.literal("png-force"),
  v.literal("svg"),
]);
const widthValidator = v.union([
  v.literal(400),
  v.literal(800),
  v.literal(1200),
  v.literal(1600),
]);

function parseUrl(url: URL) {
  const width = Number.parseInt(url.searchParams.get("width") ?? "", 10);
  if (!allowedWidths.has(width)) throw new Error("Invalid width");
  return {
    key: url.pathname.substring(1),
    width: v.parse(widthValidator, width),
    format: v.parse(formatValidator, url.searchParams.get("format")),
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const parsed = parseUrl(new URL(request.url));
    const response = await fetch(
      `https://assets.namachan10777.dev/${parsed.key}`,
      {
        cf: {
          image: {
            format: parsed.format,
            width: parsed.width,
            fit: "contain",
          },
          cacheEverything: true,
          cacheTtl: 31536000,
        },
      },
    );
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    logServerError("warn", "Failed to serve image", error, {
      url: request.url,
    });
    return new Response("", { status: 404 });
  }
}
