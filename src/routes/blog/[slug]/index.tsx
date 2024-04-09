import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type StaticGenerateHandler,
} from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";
import MarkdownDocument from "../../../components/md/document";
import type { Root } from "mdast";
import Badge from "~/components/display/badge";

export const onStaticSiteGenerate: StaticGenerateHandler = async () => {
  return {
    params: allBlogs.map((blog) => ({ slug: blog._meta.path })),
  };
};

export const useMarkdownLoader = routeLoader$(async (req) => {
  const blog = allBlogs.find((blog) => blog._meta.path === req.params.slug);
  if (blog) {
    return blog;
  } else {
    throw new Error(`Blog ${req.params.slug} not found`);
  }
});

export default component$(() => {
  const blog = useMarkdownLoader();
  return (
    <article>
      <header class="py-4">
        <span class="text-gray-600">{blog.value.date}</span>
        <h1 class="my-2 text-3xl font-bold text-black">{blog.value.title}</h1>
        <nav>
          <ul class="flex flex-row flex-wrap">
            {blog.value.category.map((category) => (
              <li key={category}>
                <Badge href={`/category/${category}`}>{category}</Badge>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <MarkdownDocument src={blog.value.mdast as unknown as Root} />
    </article>
  );
});
