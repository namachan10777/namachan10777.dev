import { component$ } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";
import styles from "./styles.module.css";

export const Header = component$(() => {
  return (
    <header class={styles.header}>
      <div class={styles.content}>
        <Link class={styles.link} href="/">
          namachan10777.dev
        </Link>
      </div>
      <div class={styles.borderLine} aria-hidden="true" />
    </header>
  );
});
