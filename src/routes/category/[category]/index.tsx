import { component$, useStylesScoped$ } from "@builder.io/qwik";
import type {
  DocumentHead,
  StaticGenerateHandler,
} from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";
import BlogHeadingLong from "~/components/composite/blog-heading-long";
import styles from "./index.css?inline";
import { ogMetaTags } from "~/lib/og-meta-tags";

export const onStaticGenerate: StaticGenerateHandler = async () => {
  return {
    params: [
      ...new Set(
        allBlogs
          .filter((blog) => blog.publish)
          .flatMap((blog) => blog.category),
      ),
    ].map((category) => ({ category })),
  };
};

export const useCategoryLoader = routeLoader$(async (req) => {
  const blogs = allBlogs
    .filter((blog) => blog.publish)
    .filter((blog) => blog.category.includes(req.params.category));
  return {
    category: req.params.category,
    blogs,
  };
});

export default component$(() => {
  useStylesScoped$(styles);
  const data = useCategoryLoader();
  return (
    <nav>
      <header>
        <h1 class="title my-4 text-3xl font-bold">{data.value.category}</h1>
      </header>
      <ul class="flex flex-col gap-8">
        {data.value.blogs.map((blog) => (
          <li key={blog._meta.path}>
            <BlogHeadingLong blog={blog} limit={160} />
          </li>
        ))}
      </ul>
    </nav>
  );
});

export const head: DocumentHead = ({ params, url }) => {
  return {
    title: `#${params.category}`,
    meta: [
      {
        name: "description",
        content: `${params.category}に関する記事`,
      },
      ...ogMetaTags({
        title: `#${params.category}`,
        description: `${params.category}に関する記事`,
        imgUrl: `${url}og.webp`,
        type: "website",
        twitter: {
          imgType: "summary_large_image",
          username: "namachan10777",
        },
      }),
    ],
  };
};
