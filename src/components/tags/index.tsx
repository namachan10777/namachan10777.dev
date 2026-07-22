import { Link } from "react-router";
import styles from "./styles.module.css";

export interface TagsProps {
  tags: string[];
}

export function Tags({ tags }: TagsProps) {
  return (
    <nav>
      <ul className={styles.tags}>
        {tags.map((tag) => (
          <li key={tag}>
            <Link to={`/post/tag/${tag}/1`}>{tag}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
