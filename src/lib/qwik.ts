import { $, QRL, implicit$FirstArg, useSignal } from "@builder.io/qwik";

export const useDebouncerQrl = <A extends unknown[], R>(
  fn: QRL<(...args: A) => R>,
  delay: number,
): QRL<(...args: A) => void> => {
  const timeoutId = useSignal<number>();

  return $((...args: A): void => {
    window.clearTimeout(timeoutId.value);
    timeoutId.value = window.setTimeout((): void => {
      void fn(...args);
    }, delay);
  });
};

export const useDebouncer$ = implicit$FirstArg(useDebouncerQrl);
