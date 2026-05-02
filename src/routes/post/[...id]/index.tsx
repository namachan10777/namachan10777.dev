import { component$ } from "@qwik.dev/core";
import {
  StaticGenerateHandler,
  routeAction$,
  routeLoader$,
  type DocumentHead,
  valibot$,
} from "@qwik.dev/router";
import { buildPostHead } from "~/lib/post-head";
import styles from "./markdown.module.css";
import { Tags } from "~/components/tags";
import { NotFound } from "~/components/not-found";
import * as v from "valibot";
import * as postsSchema from "~/generated/posts/posts-valibot";
import { Footnotes, Markdown } from "~/components/markdown";
import { CommentSection } from "~/components/comments";
import { CommentPostSchema, CommentSchema, type Comment } from "~/lib/comments";
import { logServerError } from "~/lib/server-log";
import { verifyTurnstileToken } from "~/lib/turnstile";

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

    const comments = v.parse(v.array(CommentSchema), commentsResult.results);

    const turnstileSiteKey = env.get("TURNSTILE_SITE_KEY") || "";

    return {
      body: v.parse(postsSchema.bodyDocument, body),
      comments,
      turnstileSiteKey,
    };
  } catch (error) {
    logServerError("warn", "Failed to load post", error, { id: params.id });
    status(404);
    return null;
  }
});

export const useSubmitComment = routeAction$(
  async ({ name, content, turnstileToken }, { env, fail, params }) => {
    const secretKey = env.get("TURNSTILE_SECRET_KEY");
    if (!secretKey) {
      return fail(500, { message: "Turnstile not configured" });
    }

    const verification = await verifyTurnstileToken(turnstileToken, secretKey);
    if (!verification.success) {
      return fail(400, { message: "Turnstile verification failed" });
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await env
      .get("DB")!
      .prepare(
        "INSERT INTO comments (post_id, id, created_at, name, content) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(params.id, id, createdAt, name, content)
      .run();

    const comment: Comment = {
      post_id: params.id,
      id,
      created_at: createdAt,
      name,
      content,
    };

    return { comment };
  },
  valibot$(CommentPostSchema),
);

export default component$(() => {
  const page = usePost();
  const submitCommentAction = useSubmitComment();
  if (page.value) {
    const body = page.value.body;
    const published = new Date(body.frontmatter.date);
    return (
      <>
        <article data-pagefind-body>
          <header class={styles.header}>
            <h1 data-pagefind-meta={`date:${published.toISOString()}`}>
              {body.frontmatter.title}
            </h1>
            <p>{body.frontmatter.description}</p>
            <div
              data-pagefind-meta={`tags:${body.frontmatter.tags
                .map((record) => record.tag)
                .join(",")}`}
            >
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
          submitAction={submitCommentAction}
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
      meta: [{ name: "description", content: "Not found" }],
    };
  }
  return buildPostHead(post, params, url);
};
