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
  if (!(params.id in pages)) {
    status(404);
    return undefined;
  } else if (pages[params.id].frontmatter.publish) {
    return params.id;
  } else {
    status(404);
    return undefined;
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
    params: Object.entries(pages)
      .filter((entry) => entry[1].frontmatter.publish)
      .map((entry) => {
        return { id: entry[0] };
      }),
  };
};

export const head: DocumentHead = ({ params, url }) => {
  const page = pages[params.id];
  const meta = [
    {
      name: "description",
      content: page.frontmatter.description,
    },
    {
      property: "og:title",
      content: page.frontmatter.title,
    },
    {
      property: "og:type",
      content: "article",
    },
    {
      property: "og:url",
      content: `${url.origin}/post/${params.id}`,
    },
    {
      property: "og:description",
      content: page.frontmatter.description,
    },
    {
      property: "og:locale",
      content: "ja_JP",
    },
  ];
  if (page.frontmatter.og_image) {
    meta.push({
      property: "og:image",
      content: `${url.origin}/${page.frontmatter.og_image}`,
    });
  }
  if (page) {
    return {
      title: page.frontmatter.title,
      meta,
    };
  } else {
    return {
      title: "Not found",
      meta: [
        {
          name: "description",
          content: "Not found",
        },
      ],
    };
  }
};
