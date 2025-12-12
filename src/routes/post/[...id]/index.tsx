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
import { CommentSection } from "~/components/comments";
import type { Comment } from "~/routes/api/comments/[...id]";

const CommentSchema = v.object({
  post_id: v.string(),
  id: v.string(),
  created_at: v.string(),
  name: v.string(),
  content: v.string(),
});

export const usePost = routeLoader$(async ({ params, status, env }) => {
  try {
    console.log(env.get("DB"), env.get("KV"));
    const [body, commentsResult] = await Promise.all([
      env.get("KV")!.get(params.id, { type: "json" }),
      env
        .get("DB")!
        .prepare(
          "SELECT post_id, id, created_at, name, content FROM comments WHERE post_id = ? ORDER BY created_at DESC",
        )
        .bind(params.id)
        .all()
        .catch(() => ({ results: [] })),
    ]);

    const comments = v.parse(
      v.array(CommentSchema),
      commentsResult.results,
    ) as Comment[];

    const turnstileSiteKey = env.get("TURNSTILE_SITE_KEY") || "";

    return {
      body: body as posts.BodyDocument,
      comments,
      turnstileSiteKey,
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
        </article>
        <CommentSection
          postId={page.value.body.frontmatter.id}
          initialComments={page.value.comments}
          turnstileSiteKey={page.value.turnstileSiteKey}
        />
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
