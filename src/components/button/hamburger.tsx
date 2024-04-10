import { type Signal, component$, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./hamburger.css?inline";

export type Props = {
  open: Signal<boolean>;
};

export default component$((props: Props) => {
  useStylesScoped$(styles);
  return (
    <button
      aria-label={
        props.open.value ? "ナビゲーションを閉じる" : "ナビゲーションを開く"
      }
      class={["root"].concat(props.open.value ? ["open"] : [])}
      onClick$={() => {
        props.open.value = !props.open.value;
      }}
    >
      <div class={["bar", "top"]}></div>
      <div class={["bar", "mid"]}></div>
      <div class={["bar", "btm"]}></div>
    </button>
  );
});
