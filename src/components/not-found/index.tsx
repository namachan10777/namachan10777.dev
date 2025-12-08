import { component$ } from "@builder.io/qwik";
import styles from "./styles.module.css";

export const NotFound = component$(() => {
  return (
    <header class={styles.container}>
      <h1>Page Not Found</h1>
      <p>ページが見つかりません</p>
    </header>
  );
});
