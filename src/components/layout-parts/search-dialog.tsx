import {
  type Signal,
  component$,
  useStylesScoped$,
  useSignal,
  useStore,
} from "@builder.io/qwik";
import { Modal, ModalContent } from "@qwik-ui/headless";
import styles from "./search-dialog.css?inline";
import type { Data } from "~/lib/pagefind";
import { useDebounce$, usePagefind } from "~/lib/hooks";
import { InUndo, InSearch } from "@qwikest/icons/iconoir";
import { Link } from "@builder.io/qwik-city";

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
      <ModalContent class="p-2">
        <div class="flex flex-row items-center gap-1 px-2">
          <InSearch class="text-xl" />
          <input
            type="text"
            placeholder="Search"
            bind:value={query}
            class="w-full p-2 focus:outline-none"
          />
          <button
            onClick$={() => {
              props.show.value = false;
            }}
          >
            <InUndo class="text-xl" />
          </button>
        </div>
        <ul class="flex flex-col gap-4 border-t px-2 py-2">
          {queried.results.map((result) => (
            <li key={result.id}>
              <a href={result.data.url}>
                <section class="flex flex-col gap-2">
                  <header class="font-bold underline md:text-lg">
                    {result.data.meta.title}
                  </header>
                  <summary
                    class="text-sm md:text-base"
                    dangerouslySetInnerHTML={result.data.excerpt}
                  ></summary>
                </section>
              </a>
            </li>
          ))}
        </ul>
      </ModalContent>
    </Modal>
  );
});
