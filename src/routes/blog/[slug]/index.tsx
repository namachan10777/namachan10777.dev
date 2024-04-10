import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  routeLoader$,
  type StaticGenerateHandler,
} from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";
import MarkdownDocument from "../../../components/md/document";
import type { Root } from "mdast";
import Badge from "~/components/display/badge";
import { ogMetaTags } from "~/lib/og-meta-tags";

export const onStaticGenerate: StaticGenerateHandler = async () => {
  return {
    params: allBlogs
      .filter((blog) => blog.publish)
      .map((blog) => ({ slug: blog._meta.path })),
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
      <header class="py-6">
        <span class="text-gray-600">{blog.value.date}</span>
        <h1 class="my-2 text-3xl font-bold text-black">{blog.value.title}</h1>
        <nav>
          <ul class="mt-4 flex flex-row flex-wrap">
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

export const head: DocumentHead = ({ resolveValue, url }) => {
  const blog = resolveValue(useMarkdownLoader);
  return {
    title: blog.title,
    meta: [
      {
        name: "description",
        content: blog.description,
      },
      ...ogMetaTags({
        title: blog.title,
        description: blog.description,
        imgUrl: `${url}og.webp`,
        type: "article",
        twitter: {
          imgType: "summary_large_image",
          username: "namachan10777",
        },
      }),
    ],
  };
};
