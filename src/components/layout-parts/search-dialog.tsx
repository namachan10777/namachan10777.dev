import {
  type Signal,
  component$,
  useStylesScoped$,
  useSignal,
  useVisibleTask$,
  useStore,
  noSerialize,
  NoSerialize,
} from "@builder.io/qwik";
import { Modal, ModalContent } from "@qwik-ui/headless";
import styles from "./search-dialog.css?inline";
import { PagefindApi, loadPagefind, Data } from "~/misc/pagefind";

export type Props = {
  show: Signal<boolean>;
};

export default component$((props: Props) => {
  const { scopeId } = useStylesScoped$(styles);
  const query = useSignal("");
  const debounceDuration = 300;

  const pagefind = useStore<{ api: NoSerialize<PagefindApi> | null }>({
    api: null,
  });

  const queried = useStore<{ results: { id: string; data: Data }[] }>({
    results: [],
  });

  const debounceInfo = useStore<{
    lastQueried: number;
    timeoutHandler: ReturnType<typeof setTimeout> | null;
  }>({
    lastQueried: 0,
    timeoutHandler: null,
  });

  useVisibleTask$(async () => {
    const api = await loadPagefind();
    await api.init();
    pagefind.api = noSerialize(api);
  });

  useVisibleTask$(async ({ track }) => {
    track(() => pagefind.api);
    track(() => query.value);
    const now = Date.now();
    if (pagefind.api) {
      // 現在実行待ちのクエリを一旦キャンセル
      if (debounceInfo.timeoutHandler) {
        clearTimeout(debounceInfo.timeoutHandler);
        debounceInfo.timeoutHandler = null;
      }
      // 前回からdebounceDuration経っている場合は即座に検索可能
      if (now > debounceInfo.lastQueried + debounceDuration) {
        debounceInfo.lastQueried = Date.now();
        const result = await pagefind.api.search(query.value);
        queried.results = await Promise.all(
          result.results.map(async (result) => ({
            data: await result.data(),
            id: result.id,
          })),
        );
      }
      // timeoutでdebounceDurationたってから検索するのを予約
      else {
        debounceInfo.timeoutHandler = setTimeout(async () => {
          if (pagefind.api) {
            const result = await pagefind.api?.search(query.value);
            debounceInfo.lastQueried = Date.now();
            queried.results = await Promise.all(
              result.results.map(async (result) => ({
                data: await result.data(),
                id: result.id,
              })),
            );
          }
        }, debounceDuration);
      }
    }
  });
  return (
    <Modal bind:show={props.show} class={["root", scopeId]}>
      <ModalContent>
        <input type="text" placeholder="Search" bind:value={query} />
        <ul>
          {queried.results.map((result) => (
            <li key={result.id}>{result.data.excerpt}</li>
          ))}
        </ul>
      </ModalContent>
    </Modal>
  );
});
