import { component$ } from "@builder.io/qwik";
import styles from "./tags.module.css";
import { Link } from "@builder.io/qwik-city";

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
