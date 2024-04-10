import { Slot, component$, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./badge.css?inline";
import { Link } from "@builder.io/qwik-city";

export type Props = {
  href?: string;
};

export default component$((props: Props) => {
  useStylesScoped$(styles);
  if (props.href) {
    return (
      <span class="badge">
        <Link class={["text-blue-600 underline"]} href={props.href}>
          <Slot />
        </Link>
      </span>
    );
  } else {
    return (
      <span class="badge">
        <Slot />
      </span>
    );
  }
});
