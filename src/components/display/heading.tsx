import { Slot, component$, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./heading.css?inline";

export type Props = {
  level: 2 | 3 | 4 | 5 | 6;
};

export default component$((props: Props) => {
  useStylesScoped$(styles);
  switch (props.level) {
    case 2:
      return (
        <h2 class="heading text-2xl">
          <Slot />
        </h2>
      );
    case 3:
      return (
        <h3 class="heading text-xl">
          <Slot />
        </h3>
      );
    case 4:
      return (
        <h4 class="heading text-lg">
          <Slot />
        </h4>
      );
    case 5:
      return (
        <h5 class="heading text-lg">
          <Slot />
        </h5>
      );
    case 6:
      return (
        <h6 class="heading text-lg">
          <Slot />
        </h6>
      );
  }
});
