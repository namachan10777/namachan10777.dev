import {
  type Signal,
  component$,
  useStylesScoped$,
  useSignal,
  useStore,
} from "@builder.io/qwik";
import { Modal, ModalContent } from "@qwik-ui/headless";
import styles from "./search-dialog.css?inline";
import type { Data } from "~/misc/pagefind";
import { useDebounce$, usePagefind } from "~/lib/hooks";

export type Props = {
  show: Signal<boolean>;
};

export default component$((props: Props) => {
  const { scopeId } = useStylesScoped$(styles);
  const query = useSignal("");

  const pagefind = usePagefind();

  const queried = useStore<{ results: { id: string; data: Data }[] }>({
    results: [],
  });

  useDebounce$(async ({ track }) => {
    track(() => pagefind.api);
    track(() => query.value);
    if (pagefind.api) {
      const result = await pagefind.api.search(query.value);
      queried.results = await Promise.all(
        result.results.map(async (result) => ({
          data: await result.data(),
          id: result.id,
        })),
      );
    }
  }, 300);

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
