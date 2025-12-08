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
import { Footnotes, Markdown } from "~/components/markdown";
import { LikeButton } from "~/components/like-button";

export const usePost = routeLoader$(async ({ params, status, env }) => {
  try {
    console.log(env.get("DB"), env.get("KV"));
    const [body, likes] = await Promise.all([
      await env.get("KV")!.get(params.id, { type: "json" }),
      await env
        .get("DB")!
        .prepare("SELECT count FROM likes WHERE post_id = ?")
        .bind(params.id)
        .first()
        .catch(() => ({ count: 0 })),
    ]);
    return {
      body: body as posts.BodyDocument,
      likes: likes ? v.parse(v.object({ count: v.number() }), likes).count : 0,
    };
  } catch (error) {
    console.warn(JSON.stringify(error, null, "  "));
    status(404);
    return null;
  }
});

export default component$(() => {
  const page = usePost();
  if (page.value) {
    const body = page.value.body;
    return (
      <>
        <article data-pagefind-body>
          <header class={styles.header}>
            <h1 data-pagefind-meta={`date:${body.frontmatter.date}`}>
              {body.frontmatter.title}
            </h1>
            <p>{body.frontmatter.description}</p>
            <div data-pagefind-meta={`tags:${body.frontmatter.tags.join(",")}`}>
              <Tags tags={body.frontmatter.tags.map((record) => record.tag)} />
            </div>
          </header>
          {body.root.type === "html" ? (
            <div dangerouslySetInnerHTML={body.root.content} />
          ) : (
            <Markdown root={body.root} />
          )}
          {body.footnotes.length > 0 && (
            <Footnotes footnotes={body.footnotes} />
          )}
          <div class={styles.likeContainer}>
            <LikeButton
              id={page.value.body.frontmatter.id}
              initial={page.value.likes}
            />
          </div>
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
  const post = resolveValue(usePost)?.body;
  if (!post) {
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
