import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";
import { useLocation } from "@qwik.dev/router";
import styles from "./styles.module.css";

export const NavigationIndicator = component$(() => {
  const loc = useLocation();
  const isVisible = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const isNavigating = track(() => loc.isNavigating);
    isVisible.value = isNavigating;
  });

  if (!isVisible.value) {
    return null;
  }

  return (
    <div class={styles.container} aria-hidden="true">
      <div class={styles.bar} />
    </div>
  );
});
