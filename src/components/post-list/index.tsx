import { component$ } from "@qwik.dev/core";
import { Tags } from "~/components/tags";
import { formatDateEn } from "~/lib/format";
import type { PostSummary } from "~/lib/posts";
import styles from "./styles.module.css";
import { Link } from "@qwik.dev/router";

export const PostList = component$((props: { posts: PostSummary[] }) => {
  return (
    <ol class={styles.list}>
      {props.posts.map((post) => (
        <li key={post.id}>
          <time dateTime={post.published.toString()}>
            {formatDateEn(post.published)}
          </time>
          <h3>
            <Link href={`/post/${post.id}`}>{post.title}</Link>
          </h3>
          <p>{post.description}</p>
          <Tags tags={post.tags} />
        </li>
      ))}
    </ol>
  );
});
