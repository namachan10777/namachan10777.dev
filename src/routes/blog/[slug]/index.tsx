import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type StaticGenerateHandler,
} from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";
import MarkdownDocument from "../../../components/md/document";
import { parseMarkdown } from "~/misc/md-parser";

export const onStaticSiteGenerate: StaticGenerateHandler = async () => {
  return {
    params: allBlogs.map((blog) => ({ slug: blog._meta.path })),
  };
};

export const useMarkdownLoader = routeLoader$(async (req) => {
  const blog = allBlogs.find((blog) => blog._meta.path === req.params.slug);
  if (blog) {
    return blog.mdast as unknown as Root;
  } else {
    throw new Error(`Blog ${req.params.slug} not found`);
  }
});

export default component$(() => {
  const blog = useMarkdownLoader();
  return <MarkdownDocument src={blog.value} />;
});
