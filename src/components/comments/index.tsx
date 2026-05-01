import { $, component$, useSignal } from "@qwik.dev/core";
import type { ActionStore } from "@qwik.dev/router";
import { CommentList } from "./comment-list";
import { CommentForm } from "./comment-form";
import styles from "./styles.module.css";
import * as v from "valibot";
import {
  CommentsResponseSchema,
  type Comment,
  type CommentPostInput,
  type CommentSubmitValue,
} from "~/lib/comments";

interface Props {
  postId: string;
  initialComments: Comment[];
  turnstileSiteKey: string;
  submitAction: ActionStore<CommentSubmitValue, CommentPostInput, false>;
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
      <CommentList comments={comments} />
      <CommentForm
        turnstileSiteKey={props.turnstileSiteKey}
        submitAction={props.submitAction}
        onSubmit$={refreshComments}
      />
    </section>
  );
});
