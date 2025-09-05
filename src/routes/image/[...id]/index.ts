import { RequestHandler } from "@builder.io/qwik-city";

const allowedWidths = new Set([300, 500, 800, 1000]);
const allowedFormats = new Set(["avif", "webp"]);

function parseUrl(url: URL): [string, number, string] {
  const width = parseInt(url.searchParams.get("width")!, 10);
  const format = url.searchParams.get("format")!;
  if (!allowedWidths.has(width) || !allowedFormats.has(format)) {
    throw new Error("Invalid width or format");
  }
  return [url.pathname.substring(1), width, format];
}

export const onGet: RequestHandler = async ({ request, send }) => {
  try {
    const cache = await caches.open("namachan10777dev:image");
    const url = new URL(request.url);
    const [key, width, format] = parseUrl(url);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      send(cachedResponse);
      return;
    }

    const imageResponse = await fetch(
      `https://assets.namachan10777.dev/${key}`,
      {
        cf: {
          format,
          width,
          fit: "contain",
        },
      },
    );

    if (imageResponse.status != 200) {
      send(imageResponse.status, "");
      return;
    }
    const response = new Response(imageResponse.body, {
      headers: {
        "Cache-Control": "public, max-age=31536000",
      },
    });
    await cache.put(request, response.clone());
    send(response);
  } catch (error) {
    console.warn(error);
    send(404, "");
  }
};
