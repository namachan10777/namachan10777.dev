import { RequestHandler } from "@qwik.dev/router";
import * as v from "valibot";
import { CommentSchema } from "~/lib/comments";
import { logServerError } from "~/lib/server-log";

export const onGet: RequestHandler = async ({ request, env, json }) => {
  let postId: string | undefined;
  try {
    const url = new URL(request.url);
    postId = url.pathname.match(/^\/api\/comments\/(.+)$/)![1];

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
    logServerError("error", "Failed to fetch comments", error, { postId });
    json(500, { error: "Failed to fetch comments" });
  }
};
