import { component$ } from "@builder.io/qwik";
import {
  StaticGenerateHandler,
  routeLoader$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { pages } from "~/lib/contents";
import { CodeBlock } from "~/components/code-block";
import styles from "./markdown.module.css";
import { Tags } from "~/components/tags";

export const usePageId = routeLoader$((req) => {
  return req.params.id;
});

export default component$(() => {
  const page = pages[usePageId().value];
  const Page = page.default;
  const tags = page.frontmatter.tags;
  return (
    <>
      <header class={styles.header}>
        <h1>{page.frontmatter.title}</h1>
        <p>{page.frontmatter.description}</p>
        <Tags tags={tags} />
      </header>
      <article class={styles.article}>
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

export const head: DocumentHead = ({ params }) => {
  const page = pages[params.id];
  return {
    title: page.frontmatter.title,
    meta: [
      {
        name: "description",
        content: page.frontmatter.description,
      },
    ],
  };
};
