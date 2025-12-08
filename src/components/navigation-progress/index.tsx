import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import styles from "./styles.module.css";

export const NavigationProgress = component$(() => {
  const loc = useLocation();
  const progress = useSignal(0);
  const visible = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const isNavigating = track(() => loc.isNavigating);

    if (isNavigating) {
      visible.value = true;
      progress.value = 0;

      // 段階的に進行（嘘プログレス）
      const timers: ReturnType<typeof setTimeout>[] = [];

      timers.push(setTimeout(() => (progress.value = 30), 50));
      timers.push(setTimeout(() => (progress.value = 50), 150));
      timers.push(setTimeout(() => (progress.value = 70), 300));
      timers.push(setTimeout(() => (progress.value = 85), 500));

      return () => timers.forEach(clearTimeout);
    } else {
      // ナビゲーション完了時に100%にして、少し待ってからフェードアウト
      progress.value = 100;
      const timer = setTimeout(() => {
        visible.value = false;
        progress.value = 0;
      }, 200);

      return () => clearTimeout(timer);
    }
  });

  return (
    <div
      class={`${styles.container} ${visible.value ? styles.visible : ""}`}
      aria-hidden="true"
    >
      <div
        class={styles.bar}
        style={{ transform: `scaleX(${progress.value / 100})` }}
      />
    </div>
  );
});
