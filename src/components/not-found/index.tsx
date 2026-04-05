import { component$ } from "@qwik.dev/core";
import styles from "./styles.module.css";

export const NotFound = component$(() => {
  return (
    <section class={styles.container}>
      <h1>Page Not Found</h1>
      <p>ページが見つかりません</p>
    </section>
  );
});
