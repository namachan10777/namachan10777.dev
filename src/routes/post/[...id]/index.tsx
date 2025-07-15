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
import { NotFound } from "~/components/not-found";

export const usePageId = routeLoader$(async ({ params, status }) => {
  if (!(params.id in pages) || !pages[params.id].frontmatter.publish) {
    status(404);
    return undefined;
  } else {
    return params.id;
  }
});

export default component$(() => {
  const pageId = usePageId();
  if (pageId.value) {
    const page = pages[pageId.value];
    const Page = page.default;
    const tags = page.frontmatter.tags;
    return (
      <>
        <article data-pagefind-body>
          <header class={styles.header}>
            <h1 data-pagefind-meta={`date:${page.frontmatter.date}`}>
              {page.frontmatter.title}
            </h1>
            <p>{page.frontmatter.description}</p>
            <div data-pagefind-meta={`tags:${tags.join(",")}`}>
              <Tags tags={tags} />
            </div>
          </header>
          <div class={styles.markdown}>
            <Page components={{ pre: CodeBlock }} />
          </div>
        </article>
      </>
    );
  } else {
    return <NotFound />;
  }
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
    title: page ? page.frontmatter.title : "Not found",
    meta: [
      {
        name: "description",
        content: page ? page.frontmatter.description : "Not found",
      },
    ],
  };
};
