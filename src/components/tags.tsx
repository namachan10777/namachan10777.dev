import { component$ } from "@builder.io/qwik";
import styles from "./tags.module.css";

export interface TagsProps {
  tags: string[];
}

export const Tags = component$((props: TagsProps) => {
  return (
    <nav>
      <ul class={styles.tags}>
        {props.tags.map((tag) => (
          <li key={tag}>
            <a href={`/post/tag/${tag}/1`}>{tag}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
});
