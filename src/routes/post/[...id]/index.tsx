import { component$ } from "@builder.io/qwik";
import {
  StaticGenerateHandler,
  routeLoader$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import styles from "./markdown.module.css";
import { Tags } from "~/components/tags";
import { NotFound } from "~/components/not-found";
import * as v from "valibot";
import * as posts from "~/generated/posts/posts";
import { Footnotes, Markdown } from "~/components/markdown/root";

export const usePost = routeLoader$(async ({ params, status, env }) => {
  try {
    const kv = env.get("KV");
    const value = kv && (await kv.get(params.id, { type: "json" }));
    return value as posts.BodyDocument;
  } catch (error) {
    console.warn(JSON.stringify(error, null, "  "));
    status(404);
    return null;
  }
});

export default component$(() => {
  const page = usePost();
  if (page.value) {
    return (
      <>
        <article data-pagefind-body>
          <header class={styles.header}>
            <h1 data-pagefind-meta={`date:${page.value.frontmatter.date}`}>
              {page.value.frontmatter.title}
            </h1>
            <p>{page.value.frontmatter.description}</p>
            <div
              data-pagefind-meta={`tags:${page.value.frontmatter.tags.join(",")}`}
            >
              <Tags
                tags={page.value.frontmatter.tags.map((record) => record.tag)}
              />
            </div>
          </header>
          {page.value.root.type === "html" ? (
            <div dangerouslySetInnerHTML={page.value.root.content} />
          ) : (
            <Markdown root={page.value.root} />
          )}
          {page.value.footnotes.length > 0 && (
            <Footnotes footnotes={page.value.footnotes} />
          )}
        </article>
      </>
    );
  } else {
    return <NotFound />;
  }
});

export const onStaticGenerate: StaticGenerateHandler = async ({ env }) => {
  const d1 = env.get("DB");
  const schema = v.nullish(
    v.array(
      v.object({
        id: v.string(),
      }),
    ),
  );
  const ids = v.parse(
    schema,
    d1 && (await d1.prepare("SELECT id FROM posts WHERE posts.publish;").run()),
  );
  return {
    params: ids || [],
  };
};

export const head: DocumentHead = ({ params, url, resolveValue }) => {
  const post = resolveValue(usePost);
  if (post === null) {
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
  const meta = [
    {
      name: "description",
      content: post.frontmatter.description,
    },
    {
      property: "og:title",
      content: post.frontmatter.title,
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
      content: post.frontmatter.description,
    },
    {
      property: "og:locale",
      content: "ja_JP",
    },
  ];
  if (post.frontmatter.og_image) {
    const og = post.frontmatter.og_image;
    meta.push({
      property: "og:image",
      content: `${url.origin}/image?bucket=${og.pointer.bucket}?key=${og.pointer.key}?format=webp`,
    });
  }
  return {
    title: post.frontmatter.title,
    meta,
  };
};
