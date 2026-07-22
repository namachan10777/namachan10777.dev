import type { Comment } from "~/lib/comments";
import { formatDateTimeJa } from "~/lib/format";
import styles from "./styles.module.css";

export function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return <p className={styles.noComments}>コメントはまだありません</p>;
  }

  return (
    <div className={styles.commentList}>
      {comments.map((comment) => (
        <article key={comment.id} className={styles.comment}>
          <header className={styles.commentHeader}>
            <span className={styles.commentName}>{comment.name}</span>
            <time
              className={styles.commentDate}
              dateTime={new Date(comment.created_at).toISOString()}
            >
              {formatDateTimeJa(new Date(comment.created_at))}
            </time>
          </header>
          <div className={styles.commentContent}>{comment.content}</div>
        </article>
      ))}
    </div>
  );
}
