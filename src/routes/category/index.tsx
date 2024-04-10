import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";
import CategoryHeading from "~/components/composite/category-heading";

export default component$(() => {
  const categories = new Set(...allBlogs.map((blog) => blog.category));
  return (
    <ul class="flex flex-col gap-8">
      {[...categories.values()].map((category) => (
        <li key={category}>
          <CategoryHeading
            category={category}
            articles={allBlogs
              .filter((blog) => blog.category.includes(category))
              .map((article) => ({
                path: `/blog/${article._meta.path}`,
                title: article.title,
              }))}
          />
        </li>
      ))}
    </ul>
  );
});

export const head: DocumentHead = {
  title: "Blog",
};
