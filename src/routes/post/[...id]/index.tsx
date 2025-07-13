import { component$ } from "@builder.io/qwik";
import {
  StaticGenerateHandler,
  useLocation,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { pages } from "~/lib/contents";

export default component$(() => {
  const page = pages[useLocation().params.id];
  const Page = page.default;
  return (
    <>
      <h1>Hi 👋</h1>
      <Page />
    </>
  );
});

export const onStaticGenerate: StaticGenerateHandler = () => {
  return {
    params: Object.keys(pages).map((id) => {
      return { id };
    }),
  };
};

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
