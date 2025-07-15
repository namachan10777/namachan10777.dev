import { $, component$, useSignal } from "@builder.io/qwik";
import { Modal } from "@qwik-ui/headless";
import { usePagefind, type PagefindSearchFragment } from "~/lib/pagefind";

export const SearchDialog = component$(() => {
  const pagefind = usePagefind();
  const results = useSignal<{ id: string; data: PagefindSearchFragment }[]>([]);
  const onInput = $((e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    if (pagefind.api) {
      pagefind.api.debouncedSearch(target.value).then(async (result) => {
        if (result) {
          results.value = await Promise.all(
            result.results.map(async (result) => {
              return {
                id: result.id,
                data: await result.data(),
              };
            }),
          );
        }
      });
    }
  });
  return (
    <Modal.Root>
      <Modal.Trigger>Open Modal</Modal.Trigger>
      <Modal.Panel>
        <Modal.Title>Moda title</Modal.Title>
        <Modal.Description>Modal description</Modal.Description>
        <input onInput$={onInput} />
        <pre>{JSON.stringify(results.value, null, "  ")}</pre>
      </Modal.Panel>
    </Modal.Root>
  );
});
