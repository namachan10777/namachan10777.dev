import * as v from "valibot";

export const CommentSchema = v.object({
  post_id: v.string(),
  id: v.string(),
  created_at: v.string(),
  name: v.string(),
  content: v.string(),
});

export type Comment = v.InferOutput<typeof CommentSchema>;

export const CommentsResponseSchema = v.object({
  comments: v.array(CommentSchema),
});
