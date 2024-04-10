import type {
  RequestHandler,
  StaticGenerateHandler,
} from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";
import { ogImage } from "~/components/og/og";

export const onStaticGenerate: StaticGenerateHandler = async () => {
  return {
    params: allBlogs
      .filter((blog) => blog.publish)
      .map((blog) => ({ slug: blog._meta.path })),
  };
};

export const onGet: RequestHandler = async ({ send, params }) => {
  const blog = allBlogs.find((blog) => blog._meta.path === params.slug);
  if (blog === undefined) {
    send(400, "Not found");
    return;
  }

  const img = await ogImage({
    title: blog.title,
    description: blog.description,
    url: `/blog/${blog._meta.path}`,
    titleFontSize: 2.5,
    width: 800,
    height: 418,
  });
  send(200, img);
};
