import { $, component$, useSignal } from "@builder.io/qwik";
import type { Comment } from "~/routes/api/comments/[...id]";
import { CommentList } from "./comment-list";
import { CommentForm } from "./comment-form";
import styles from "./styles.module.css";
import * as v from "valibot";

interface Props {
  postId: string;
  initialComments: Comment[];
  turnstileSiteKey: string;
}

const CommentsResponseSchema = v.object({
  comments: v.array(
    v.object({
      post_id: v.string(),
      id: v.string(),
      created_at: v.string(),
      name: v.string(),
      content: v.string(),
    }),
  ),
});

export const CommentSection = component$((props: Props) => {
  const comments = useSignal<Comment[]>(props.initialComments);

  const refreshComments = $(async () => {
    try {
      const response = await fetch(`/api/comments/${props.postId}`);
      if (response.ok) {
        const data = v.parse(CommentsResponseSchema, await response.json());
        comments.value = data.comments;
      }
    } catch (e) {
      console.error("Failed to refresh comments:", e);
    }
  });

  return (
    <section class={styles.commentSection}>
      <h2>コメント</h2>
      <CommentList comments={comments.value} />
      <CommentForm
        postId={props.postId}
        turnstileSiteKey={props.turnstileSiteKey}
        onSubmit$={refreshComments}
      />
    </section>
  );
});
