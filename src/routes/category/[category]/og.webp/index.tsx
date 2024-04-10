import type {
  RequestHandler,
  StaticGenerateHandler,
} from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";
import { ogImage } from "~/components/og/og";

export const onStaticGenerate: StaticGenerateHandler = async () => {
  return {
    params: [...new Set(allBlogs.flatMap((blog) => blog.category))].map(
      (category) => ({ category }),
    ),
  };
};

export const onGet: RequestHandler = async ({ send, params }) => {
  const img = await ogImage({
    title: `#${params.category}`,
    description: `Blog posts in category #${params.category}`,
    url: `/category/${params.category}`,
    titleFontSize: 2.5,
    width: 800,
    height: 418,
  });
  send(200, img);
};
