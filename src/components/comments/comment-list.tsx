import { component$, type Signal } from "@qwik.dev/core";
import type { Comment } from "~/lib/comments";
import { formatDateTimeJa } from "~/lib/format";
import styles from "./styles.module.css";

interface Props {
  comments: Signal<Comment[]>;
}

export const CommentList = component$((props: Props) => {
  const comments = props.comments.value;

  if (comments.length === 0) {
    return <p class={styles.noComments}>コメントはまだありません</p>;
  }

  return (
    <div class={styles.commentList}>
      {comments.map((comment) => (
        <article key={comment.id} class={styles.comment}>
          <header class={styles.commentHeader}>
            <span class={styles.commentName}>{comment.name}</span>
            <time
              class={styles.commentDate}
              dateTime={new Date(comment.created_at).toISOString()}
            >
              {formatDateTimeJa(new Date(comment.created_at))}
            </time>
          </header>
          <div class={styles.commentContent}>{comment.content}</div>
        </article>
      ))}
    </div>
  );
});
