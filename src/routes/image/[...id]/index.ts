import { RequestHandler } from "@builder.io/qwik-city";
import * as v from "valibot";

const allowedWidths = new Set([300, 500, 800, 1000]);
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
  v.literal(300),
  v.literal(500),
  v.literal(800),
  v.literal(1000),
]);

function parseUrl(
  url: URL,
): [
  string,
  v.InferOutput<typeof widthValidator>,
  v.InferOutput<typeof formatValidator>,
] {
  const width = parseInt(url.searchParams.get("width")!, 10);
  const format = url.searchParams.get("format")!;
  if (!allowedWidths.has(width)) {
    throw new Error("Invalid width or format");
  }
  return [
    url.pathname.substring(1),
    v.parse(widthValidator, width),
    v.parse(formatValidator, format),
  ];
}

export const onGet: RequestHandler = async ({ request, send }) => {
  try {
    const url = new URL(request.url);
    const [key, width, format] = parseUrl(url);
    const response = await fetch(`https://assets.namachan10777.dev/${key}`, {
      cf: {
        image: {
          format,
          width,
          fit: "contain",
        },
        cacheEverything: true,
        cacheTtl: 60,
      },
    });
    send(response);
  } catch (error) {
    console.warn(error);
    send(404, "");
  }
};
