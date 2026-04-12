import { component$ } from "@qwik.dev/core";
import { useLocation } from "@qwik.dev/router";
import styles from "./styles.module.css";

export const NavigationIndicator = component$(() => {
  const loc = useLocation();

  if (!loc.isNavigating) {
    return null;
  }

  return (
    <div class={styles.container} aria-hidden="true">
      <div class={styles.bar} />
    </div>
  );
});
