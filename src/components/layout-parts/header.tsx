import { Signal, component$ } from "@builder.io/qwik";
import Hamburger from "../button/hamburger";

export type Props = {
  sidePaneOpen: Signal<boolean>;
};

export default component$((props: Props) => {
  return (
    <header class="flex h-full w-full flex-row items-center justify-between border-b border-black">
      <a href="/">パターンに基づく</a>
      <Hamburger open={props.sidePaneOpen} />
    </header>
  );
});
