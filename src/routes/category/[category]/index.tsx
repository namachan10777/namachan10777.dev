import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { StaticGenerateHandler, routeLoader$ } from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";
import BlogHeadingLong from "~/components/composite/blog-heading-long";
import styles from "./index.css?inline";

export const onStaticGenerate: StaticGenerateHandler = async () => {
  return {
    params: [...new Set(...allBlogs.flatMap((blog) => blog.category))].map(
      (category) => ({ category }),
    ),
  };
};

export const useCategoryLoader = routeLoader$(async (req) => {
  const blogs = allBlogs.filter((blog) =>
    blog.category.includes(req.params.category),
  );
  return {
    category: req.params.category,
    blogs,
  };
});

export default component$(() => {
  useStylesScoped$(styles);
  const data = useCategoryLoader();
  return (
    <>
      <header>
        <h1 class="title my-4 text-3xl font-bold">{data.value.category}</h1>
        <ul class="flex flex-col gap-8">
          {data.value.blogs.map((blog) => (
            <li key={blog._meta.path}>
              <BlogHeadingLong blog={blog} limit={160} />
            </li>
          ))}
        </ul>
      </header>
    </>
  );
});
