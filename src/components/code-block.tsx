import { Slot, component$, $, useSignal } from "@builder.io/qwik";
import styles from "./code-block.module.css";
import CopyIcon from "~icons/iconoir/copy";
import CheckIcon from "~icons/iconoir/check";
import { useDebouncer$ } from "~/lib/qwik";

interface Props {
  data: string;
}

type Meta = {
  lines: number;
  attrs: {
    title?: string;
  };
};

const Lines = component$((props: { lines: number }) => {
  return (
    <ol aria-hidden="true" class={styles.lines}>
      {Array.from({ length: props.lines }).map((_, index) => (
        <li key={index}>{index + 1}</li>
      ))}
    </ol>
  );
});

const CopyButton = component$(() => {
  const btnRef = useSignal<Element>();
  const showCopyIcon = useSignal(true);
  const setDoneIcon = useDebouncer$(() => {
    showCopyIcon.value = true;
  }, 1000);
  const clickHandler = $(() => {
    if (btnRef.value) {
      const text =
        btnRef.value.parentElement?.querySelector("pre")?.textContent;
      if (text) {
        navigator.clipboard.writeText(text);
        showCopyIcon.value = false;
        setDoneIcon();
      }
    }
  });
  return (
    <button
      ref={btnRef}
      style={{ display: showCopyIcon.value ? undefined : "flex" }}
      class={styles.copyButton}
      onClick$={clickHandler}
    >
      {showCopyIcon.value ? <CopyIcon /> : <CheckIcon />}
    </button>
  );
});

export const CodeBlock = component$((props: Props) => {
  const meta: Meta = JSON.parse(props.data);
  return (
    <>
      <div class={styles.root}>
        {meta.attrs.title && (
          <header class={styles.header}>
            <span class={styles.headerTitle}>{meta.attrs.title}</span>
          </header>
        )}
        <Lines lines={meta.lines} />
        <div class={styles.codeBody}>
          <CopyButton />
          <div class={styles.scrollBox}>
            <pre class={styles.root}>
              <Slot />
            </pre>
          </div>
        </div>
      </div>
    </>
  );
});
