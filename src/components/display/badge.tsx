import { Slot, component$, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./badge.css?inline";

export type Props = {
  href?: string;
};

export default component$((props: Props) => {
  useStylesScoped$(styles);
  if (props.href) {
    return (
      <a class={["badge", "text-blue-600 underline"]} href={props.href}>
        <Slot />
      </a>
    );
  } else {
    return (
      <span class="badge">
        <Slot />
      </span>
    );
  }
});
