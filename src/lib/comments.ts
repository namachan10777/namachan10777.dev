import * as v from "valibot";

export const CommentSchema = v.object({
  post_id: v.string(),
  id: v.string(),
  created_at: v.string(),
  name: v.string(),
  content: v.string(),
});

export type Comment = v.InferOutput<typeof CommentSchema>;

export const CommentPostSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  content: v.pipe(v.string(), v.minLength(1), v.maxLength(10000)),
  turnstileToken: v.string(),
});

export type CommentPostInput = v.InferInput<typeof CommentPostSchema>;

export type CommentSubmitValue =
  | { comment: Comment }
  | { failed: true; message: string }
  | {
      failed: true;
      formErrors: string[];
      fieldErrors: Partial<Record<keyof CommentPostInput, string>>;
    };

export const CommentsResponseSchema = v.object({
  comments: v.array(CommentSchema),
});
