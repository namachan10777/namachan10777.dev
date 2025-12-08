import { Slot, component$, $, useSignal, Signal } from "@builder.io/qwik";
import styles from "./styles.module.css";
import { useDebouncer$ } from "~/lib/qwik";
import Copy from "~icons/iconoir/copy";
import Check from "~icons/iconoir/check";
interface Props {
  lines: number;
  title: string;
}

const Lines = component$((props: { lines: number }) => {
  return (
    <ol aria-hidden="true" class={styles.lines}>
      {Array.from({ length: props.lines }).map((_, index) => (
        <li key={index}>{index + 1}</li>
      ))}
    </ol>
  );
});

const CopyButton = component$(
  (props: { preRef: Signal<Element | undefined> }) => {
    const showCopiedMessage = useSignal(false);
    const setDoneIcon = useDebouncer$(() => {
      showCopiedMessage.value = false;
    }, 1000);
    const clickHandler = $(() => {
      if (props.preRef.value) {
        const text = props.preRef.value.textContent;
        if (text) {
          navigator.clipboard.writeText(text);
          showCopiedMessage.value = true;
          setDoneIcon();
        }
      }
    });
    return (
      <button class={styles.copyButton} onClick$={clickHandler}>
        {showCopiedMessage.value ? (
          <>
            <span>Copied</span>
            <Check />
          </>
        ) : (
          <>
            <span>Copy</span>
            <Copy />
          </>
        )}
      </button>
    );
  },
);

export const CodeBlock = component$((props: Props) => {
  const preRef = useSignal<Element>();
  return (
    <>
      <div class={styles.root}>
        {props.title && (
          <header class={styles.header}>
            <span class={styles.headerTitle}>{props.title}</span>
            <CopyButton preRef={preRef} />
          </header>
        )}
        <Lines lines={props.lines} />
        <div class={styles.codeBody}>
          <div class={styles.scrollBox}>
            <pre ref={preRef} class={styles.root}>
              <Slot />
            </pre>
          </div>
        </div>
      </div>
    </>
  );
});
