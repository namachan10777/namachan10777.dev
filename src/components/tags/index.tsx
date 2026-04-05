import { component$ } from "@qwik.dev/core";
import styles from "./styles.module.css";
import { Link } from "@qwik.dev/router";

export interface TagsProps {
  tags: string[];
}

export const Tags = component$((props: TagsProps) => {
  return (
    <nav>
      <ul class={styles.tags}>
        {props.tags.map((tag) => (
          <li key={tag}>
            <Link href={`/post/tag/${tag}/1`}>{tag}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
});
