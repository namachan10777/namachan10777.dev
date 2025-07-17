import { component$ } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";
import { NotFound } from "~/components/not-found";

export default component$(() => {
  return <NotFound />;
});

export const head: DocumentHead = () => {
  return {
    title: "Not found",
    meta: [
      {
        name: "description",
        content: "Page not found",
      },
    ],
  };
};
