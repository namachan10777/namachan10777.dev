import type { NoSerialize, QRL, TaskFn } from "@builder.io/qwik";
import {
  noSerialize,
  useStore,
  useVisibleTask$,
  implicit$FirstArg,
} from "@builder.io/qwik";
import type { Options, PagefindApi } from "~/misc/pagefind";
import { loadPagefind } from "~/misc/pagefind";

export function usePagefind(options?: Options): {
  api: NoSerialize<PagefindApi> | null;
} {
  const store = useStore<{ api: NoSerialize<PagefindApi> | null }>({
    api: null,
  });
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const api = await loadPagefind();
    if (options) {
      await api.options(options);
    }
    await api.init();
    store.api = noSerialize(api);
  });
  return store;
}

export function useDebounceQrl(qrl: QRL<TaskFn>, debounce: number) {
  const state = useStore<{
    timeoutHandler: null | number;
    lastExecuted: number;
  }>({
    timeoutHandler: null,
    lastExecuted: 0,
  });
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$((ctx) => {
    if (state.timeoutHandler) {
      clearTimeout(state.timeoutHandler);
      state.timeoutHandler = null;
    }
    if (Date.now() > state.lastExecuted + debounce) {
      state.lastExecuted = Date.now();
      qrl(ctx);
    } else {
      state.timeoutHandler = setTimeout(() => {
        state.lastExecuted = Date.now();
        qrl(ctx);
      }, debounce) as unknown as number;
    }
  });
}

export const useDebounce$ = /*#__PURE__*/ implicit$FirstArg(useDebounceQrl);
