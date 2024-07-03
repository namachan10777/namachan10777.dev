import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { post as posts } from "#site/content";
import { Link } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <>
      <h1>Hi 👋</h1>
      <nav>
        <ul>
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/post/${post.slug}`} key={post.slug}>
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
