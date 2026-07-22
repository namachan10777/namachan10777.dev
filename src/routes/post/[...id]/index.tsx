import { data, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import * as v from "valibot";
import { CommentSection } from "~/components/comments";
import { Footnotes, Markdown } from "~/components/markdown";
import { Tags } from "~/components/tags";
import * as postsSchema from "~/generated/posts/posts-valibot";
import { getBinding, getOptionalBinding } from "~/lib/cloudflare";
import {
  CommentPostSchema,
  CommentSchema,
  type Comment,
  type CommentSubmitValue,
} from "~/lib/comments";
import { buildPostHead } from "~/lib/post-head";
import { logServerError } from "~/lib/server-log";
import { verifyTurnstileToken } from "~/lib/turnstile";
import * as styles from "./markdown.css";

export async function loader({ params, context, request }: LoaderFunctionArgs) {
  const id = params["*"];
  if (!id) throw new Response("Not Found", { status: 404 });

  try {
    const db = getBinding(context, "DB");
    const kv = getBinding(context, "KV");
    const [body, commentsResult] = await Promise.all([
      kv.get(id, { type: "json" }),
      db
        .prepare(
          "SELECT post_id, id, created_at, name, content FROM comments WHERE post_id = ? ORDER BY created_at DESC",
        )
        .bind(id)
        .all()
        .catch(() => ({ results: [] })),
    ]);

    return {
      id,
      url: request.url,
      body: v.parse(postsSchema.bodyDocument, body),
      comments: v.parse(v.array(CommentSchema), commentsResult.results),
      turnstileSiteKey: getOptionalBinding(context, "TURNSTILE_SITE_KEY") || "",
    };
  } catch (error) {
    logServerError("warn", "Failed to load post", error, { id });
    throw new Response("Not Found", { status: 404 });
  }
}

export async function action({ params, context, request }: LoaderFunctionArgs) {
  const id = params["*"];
  if (!id)
    return data<CommentSubmitValue>(
      { failed: true, message: "Not found" },
      404,
    );

  try {
    const formData = await request.formData();
    const parsed = v.safeParse(CommentPostSchema, {
      name: formData.get("name"),
      content: formData.get("content"),
      turnstileToken: formData.get("turnstileToken"),
    });
    if (!parsed.success) {
      return data<CommentSubmitValue>(
        { failed: true, message: "コメントの入力内容を確認してください" },
        400,
      );
    }

    const secretKey = getOptionalBinding(context, "TURNSTILE_SECRET_KEY");
    if (!secretKey) {
      return data<CommentSubmitValue>(
        { failed: true, message: "Turnstile not configured" },
        500,
      );
    }

    const verification = await verifyTurnstileToken(
      parsed.output.turnstileToken,
      secretKey,
    );
    if (!verification.success) {
      return data<CommentSubmitValue>(
        { failed: true, message: "Turnstile verification failed" },
        400,
      );
    }

    const comment: Comment = {
      post_id: id,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      name: parsed.output.name,
      content: parsed.output.content,
    };
    await getBinding(context, "DB")
      .prepare(
        "INSERT INTO comments (post_id, id, created_at, name, content) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(
        comment.post_id,
        comment.id,
        comment.created_at,
        comment.name,
        comment.content,
      )
      .run();

    return data<CommentSubmitValue>({ comment });
  } catch (error) {
    logServerError("error", "Failed to submit comment", error, { id });
    return data<CommentSubmitValue>(
      { failed: true, message: "コメントの投稿に失敗しました" },
      500,
    );
  }
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
  if (!loaderData) {
    return [
      { title: "Not found" },
      { name: "description", content: "Not found" },
    ];
  }
  return buildPostHead(loaderData.body, loaderData.id, new URL(loaderData.url));
};

export default function Post({ loaderData }: { loaderData: LoaderData }) {
  const body = loaderData.body;
  const published = new Date(body.frontmatter.date);
  return (
    <>
      <article data-pagefind-body>
        <header className={styles.header}>
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
          <div dangerouslySetInnerHTML={{ __html: body.root.content }} />
        ) : (
          <Markdown root={body.root} />
        )}
        {body.footnotes.length > 0 && <Footnotes footnotes={body.footnotes} />}
      </article>
      <CommentSection
        postId={body.frontmatter.id}
        initialComments={loaderData.comments}
        turnstileSiteKey={loaderData.turnstileSiteKey}
      />
    </>
  );
}
