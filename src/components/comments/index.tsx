import { useCallback, useState } from "react";
import * as v from "valibot";
import { CommentsResponseSchema, type Comment } from "~/lib/comments";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";
import styles from "./styles.module.css";

interface Props {
  postId: string;
  initialComments: Comment[];
  turnstileSiteKey: string;
}

export function CommentSection(props: Props) {
  const [comments, setComments] = useState(props.initialComments);

  const refreshComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments/${props.postId}`);
      if (!response.ok) return;
      const data = v.parse(CommentsResponseSchema, await response.json());
      setComments(data.comments);
    } catch (error) {
      console.error("Failed to refresh comments:", error);
    }
  }, [props.postId]);

  return (
    <section className={styles.commentSection}>
      <h2>コメント</h2>
      <CommentList comments={comments} />
      <CommentForm
        turnstileSiteKey={props.turnstileSiteKey}
        onSubmitted={refreshComments}
      />
    </section>
  );
}
