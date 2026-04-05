import { component$ } from "@qwik.dev/core";
import { DocumentHead } from "@qwik.dev/router";
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
