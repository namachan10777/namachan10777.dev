import { Link } from "react-router";
import { Tags } from "~/components/tags";
import { formatDateEn } from "~/lib/format";
import type { PostSummary } from "~/lib/posts";
import * as styles from "./styles.css";

export function PostList({ posts }: { posts: PostSummary[] }) {
  return (
    <ol className={styles.list}>
      {posts.map((post) => (
        <li key={post.id}>
          <time dateTime={post.published.toString()}>
            {formatDateEn(post.published)}
          </time>
          <h3>
            <Link to={`/post/${post.id}`}>{post.title}</Link>
          </h3>
          <p>{post.description}</p>
          <Tags tags={post.tags} />
        </li>
      ))}
    </ol>
  );
}
