import { data, type LoaderFunctionArgs } from "react-router";
import * as v from "valibot";
import { getBinding } from "~/lib/cloudflare";
import { CommentSchema } from "~/lib/comments";
import { logServerError } from "~/lib/server-log";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const postId = params["*"];
  if (!postId) return data({ error: "Post not found" }, 404);

  try {
    const result = await getBinding(context, "DB")
      .prepare(
        "SELECT post_id, id, created_at, name, content FROM comments WHERE post_id = ? ORDER BY created_at DESC",
      )
      .bind(postId)
      .all();
    return data({ comments: v.parse(v.array(CommentSchema), result.results) });
  } catch (error) {
    logServerError("error", "Failed to fetch comments", error, { postId });
    return data({ error: "Failed to fetch comments" }, 500);
  }
}
