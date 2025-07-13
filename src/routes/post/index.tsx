import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { pages } from "~/lib/contents";

export default component$(() => {
  return (
    <>
      <h1>Posts</h1>
      <ul>
        {Object.entries(pages).map(([id]) => {
          return (
            <li key={id}>
              <a href={`/post/${id}`}>{id}</a>
            </li>
          );
        })}
      </ul>
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
