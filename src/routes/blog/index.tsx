import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";

export default component$(() => {
  return (
    <ul>
      {allBlogs.map((blog) => (
        <li key={blog._meta.path}>
          <a href={`/blog/${blog._meta.path}`}>{blog.title}</a>
        </li>
      ))}
    </ul>
  );
});

export const head: DocumentHead = {
  title: "Blog",
};
