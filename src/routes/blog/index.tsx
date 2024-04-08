import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";
import BlogHeadingLong from "~/components/composite/blog-heading-long";

export default component$(() => {
  return (
    <ul class="flex flex-col gap-8">
      {allBlogs.map((blog) => (
        <li key={blog._meta.path}>
          <BlogHeadingLong blog={blog} limit={160} />
        </li>
      ))}
    </ul>
  );
});

export const head: DocumentHead = {
  title: "Blog",
};
