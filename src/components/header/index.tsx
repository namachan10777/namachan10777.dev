import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
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
