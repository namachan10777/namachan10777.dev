import { component$ } from "@builder.io/qwik";
import { Tags } from "./tags";
import styles from "./post-list.module.css";
import { Link } from "@builder.io/qwik-city";

export interface PostSumaryProps {
  title: string;
  description: string;
  published: Date;
  tags: string[];
  id: string;
}

export const PostList = component$((props: { posts: PostSumaryProps[] }) => {
  return (
    <ol class={styles.list}>
      {props.posts.map((post) => (
        <li key={post.id}>
          <time dateTime={post.published.toString()}>
            {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
              post.published,
            )}
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
