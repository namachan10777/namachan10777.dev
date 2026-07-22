import { Link } from "react-router";
import styles from "./styles.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <Link className={styles.link} to="/">
          namachan10777.dev
        </Link>
      </div>
      <div className={styles.borderLine} aria-hidden="true" />
    </header>
  );
}
