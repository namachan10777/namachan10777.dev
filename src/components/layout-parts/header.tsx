import { type Signal, component$ } from "@builder.io/qwik";
import Hamburger from "../button/hamburger";

import Icon from "~/assets/icon.webp?jsx";

export type Props = {
  sidePaneOpen: Signal<boolean>;
};

export default component$((props: Props) => {
  return (
    <header class="flex h-full w-full flex-row items-center justify-between border-b border-black bg-white px-2">
      <a class="h-8 w-8" href="/">
        <Icon class="rounded-full" />
      </a>
      <Hamburger open={props.sidePaneOpen} />
    </header>
  );
});
