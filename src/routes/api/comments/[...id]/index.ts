import { RequestHandler } from "@builder.io/qwik-city";
import * as v from "valibot";
import { verifyTurnstileToken } from "~/lib/turnstile";

const CommentSchema = v.object({
  post_id: v.string(),
  id: v.string(),
  created_at: v.string(),
  name: v.string(),
  content: v.string(),
});

export type Comment = v.InferOutput<typeof CommentSchema>;

const PostBodySchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  content: v.pipe(v.string(), v.minLength(1), v.maxLength(10000)),
  turnstileToken: v.string(),
});

export const onGet: RequestHandler = async ({ request, env, json }) => {
  try {
    const url = new URL(request.url);
    const postId = url.pathname.match(/^\/api\/comments\/(.+)$/)![1];

    const result = await env
      .get("DB")!
      .prepare(
        "SELECT post_id, id, created_at, name, content FROM comments WHERE post_id = ? ORDER BY created_at DESC",
      )
      .bind(postId)
      .all();

    const comments = v.parse(v.array(CommentSchema), result.results);
    json(200, { comments });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    json(500, { error: "Failed to fetch comments" });
  }
};

export const onPost: RequestHandler = async ({ request, env, json }) => {
  try {
    const url = new URL(request.url);
    const postId = url.pathname.match(/^\/api\/comments\/(.+)$/)![1];

    const body = await request.json();
    const { name, content, turnstileToken } = v.parse(PostBodySchema, body);

    const secretKey = env.get("TURNSTILE_SECRET_KEY");
    if (!secretKey) {
      json(500, { error: "Turnstile not configured" });
      return;
    }

    const verification = await verifyTurnstileToken(turnstileToken, secretKey);
    if (!verification.success) {
      json(400, { error: "Turnstile verification failed" });
      return;
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await env
      .get("DB")!
      .prepare(
        "INSERT INTO comments (post_id, id, created_at, name, content) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(postId, id, createdAt, name, content)
      .run();

    const comment: Comment = {
      post_id: postId,
      id,
      created_at: createdAt,
      name,
      content,
    };

    json(201, { comment });
  } catch (error) {
    console.error("Failed to post comment:", error);
    if (error instanceof v.ValiError) {
      json(400, { error: "Invalid request body" });
      return;
    }
    json(500, { error: "Failed to post comment" });
  }
};
