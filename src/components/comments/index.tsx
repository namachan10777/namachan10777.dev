import { $, component$, useSignal } from "@qwik.dev/core";
import { CommentList } from "./comment-list";
import { CommentForm } from "./comment-form";
import styles from "./styles.module.css";
import * as v from "valibot";
import { CommentsResponseSchema, type Comment } from "~/lib/comments";

interface Props {
  postId: string;
  initialComments: Comment[];
  turnstileSiteKey: string;
}

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
