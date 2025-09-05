import { RequestHandler } from "@builder.io/qwik-city";

type SupportedFormat = "image/avif" | "image/webp";

const allowedWidths = new Set([300, 500, 800, 1000]);
const allowedFormats = new Map<string, SupportedFormat>([
  ["avif", "image/avif"],
  ["webp", "image/webp"],
]);

function parseUrl(url: URL): [string, number, SupportedFormat] {
  const width = parseInt(url.searchParams.get("width")!, 10);
  const format = url.searchParams.get("format")!;
  if (!allowedWidths.has(width) || !allowedFormats.has(format)) {
    throw new Error("Invalid width or format");
  }
  return [url.pathname.substring(1), width, allowedFormats.get(format)!];
}

export const onGet: RequestHandler = async ({ request, env, send }) => {
  try {
    const cache = await caches.open("namachan10777dev:image");
    const url = new URL(request.url);
    const [key, width, format] = parseUrl(url);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      send(cachedResponse);
      return;
    }

    const object = await env.get("R2")!.get(key);
    if (object === null) {
      send(404, "");
      return;
    }
    const image = await env
      .get("IMAGES")!
      .input(object.body)
      .transform({
        width,
        fit: "scale-down",
      })
      .output({
        format: allowedFormats.get(format)!,
      });
    const response = image.response();
    response.headers.set("Cache-Control", "public, max-age=31536000");
    response.headers.set("Etag", object.httpEtag);
    await cache.put(request, response);
    send(response.clone());
  } catch (error) {
    console.warn(error);
    send(404, "");
  }
};
