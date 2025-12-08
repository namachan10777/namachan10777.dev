import { $, QRL, implicit$FirstArg, useSignal } from "@builder.io/qwik";

export const useDebouncerQrl = <A extends unknown[], R>(
  fn: QRL<(...args: A) => R>,
  delay: number,
): QRL<(...args: A) => void> => {
  const timeoutId = useSignal<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  return $((...args: A): void => {
    if (typeof window === "undefined") return;
    if (timeoutId.value !== undefined) {
      clearTimeout(timeoutId.value);
    }
    timeoutId.value = setTimeout((): void => {
      void fn(...args);
    }, delay);
  });
};

export const useDebouncer$ = implicit$FirstArg(useDebouncerQrl);
