import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
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
