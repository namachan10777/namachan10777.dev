import { component$ } from "@builder.io/qwik";
import type { Comment } from "~/routes/api/comments/[...id]";
import styles from "./styles.module.css";

interface Props {
  comments: Comment[];
}

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export const CommentList = component$((props: Props) => {
  if (props.comments.length === 0) {
    return <p class={styles.noComments}>コメントはまだありません</p>;
  }

  return (
    <div class={styles.commentList}>
      {props.comments.map((comment) => (
        <div key={comment.id} class={styles.comment}>
          <div class={styles.commentHeader}>
            <span class={styles.commentName}>{comment.name}</span>
            <span class={styles.commentDate}>
              {dateFormatter.format(new Date(comment.created_at))}
            </span>
          </div>
          <div class={styles.commentContent}>{comment.content}</div>
        </div>
      ))}
    </div>
  );
});
