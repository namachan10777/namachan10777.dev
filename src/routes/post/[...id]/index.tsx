import { component$ } from "@builder.io/qwik";
import {
  StaticGenerateHandler,
  useLocation,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { pages } from "~/lib/contents";
import { CodeBlock } from "~/components/code-block";

export default component$(() => {
  const page = pages[useLocation().params.id];
  const Page = page.default;
  return (
    <>
      <article>
        <Page components={{ pre: CodeBlock }} />
      </article>
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
