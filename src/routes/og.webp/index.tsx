import type { RequestHandler } from "@builder.io/qwik-city";
import { ogImage } from "~/components/og/og";

export const onGet: RequestHandler = async ({ send }) => {
  const img = await ogImage({
    title: "namachan10777.dev",
    description: "Profile and posts.",
    url: "/",
    titleFontSize: 2.5,
    width: 800,
    height: 418,
  });
  send(200, img);
};
