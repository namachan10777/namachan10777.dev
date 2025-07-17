import { $, component$, useSignal } from "@builder.io/qwik";
import { Modal } from "@qwik-ui/headless";
import { usePagefind, type PagefindSearchFragment } from "~/lib/pagefind";
import styles from "./search-dialog.module.css";
import { Link } from "@builder.io/qwik-city";
import SearchIcon from "~icons/iconoir/search";
import { Tags } from "~/components/tags";

export const SearchDialog = component$(() => {
  const pagefind = usePagefind({ excerptLength: 60 });
  const results = useSignal<
    {
      id: string;
      data: PagefindSearchFragment;
      meta: { title: string; date: Date; tags: string[] };
    }[]
  >([]);
  const inputRef = useSignal<HTMLInputElement | undefined>();
  const onInput = $((e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    if (pagefind.api) {
      pagefind.api.debouncedSearch(target.value).then(async (result) => {
        if (result) {
          results.value = await Promise.all(
            result.results.map(async (result) => {
              const data = await result.data();
              const meta = {
                title: data.meta.title,
                date: new Date(data.meta.date),
                tags: data.meta.tags.split(","),
              };
              return {
                id: result.id,
                data: await result.data(),
                meta,
              };
            }),
          );
        }
      });
    }
  });
  const onClose = $(() => {
    if (inputRef.value) {
      inputRef.value.value = "";
    }
    results.value = [];
  });

  const showDialog = useSignal(false);

  const closeDialog = $(() => {
    showDialog.value = false;
  });

  return (
    <Modal.Root bind:show={showDialog} class={styles.root}>
      <Modal.Trigger class={styles.trigger}>
        <span class={styles.triggerPseudoInput}>Search posts (ja)</span>
        <div class={styles.triggerIcon}>
          <SearchIcon />
        </div>
      </Modal.Trigger>
      <Modal.Panel onClose$={onClose} class={styles.dialog}>
        <search class={styles.container}>
          <Modal.Title>
            <span>記事を検索する</span>
          </Modal.Title>
          <button class={styles.closeButton} onClick$={closeDialog}>
            閉じる
          </button>
          <input
            type="search"
            ref={inputRef}
            onInput$={onInput}
            placeholder="記事を検索する"
            autofocus
          />
          <ol class={styles.resultContainer}>
            {results.value.map((result) => (
              <li key={result.id}>
                <article class={styles.article}>
                  <time>
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "long",
                    }).format(result.meta.date)}
                  </time>
                  <h2>
                    <Link href={result.data.url} onClick$={closeDialog}>
                      {result.data.meta.title}
                    </Link>
                  </h2>
                  <p dangerouslySetInnerHTML={result.data.excerpt} />
                  <Tags tags={result.meta.tags} />
                </article>
              </li>
            ))}
          </ol>
        </search>
      </Modal.Panel>
    </Modal.Root>
  );
});
