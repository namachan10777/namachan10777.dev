import { Signal, component$ } from "@builder.io/qwik";
import Hamburger from "../button/hamburger";

export type Props = {
  sidePaneOpen: Signal<boolean>;
};

export default component$((props: Props) => {
  return <header class="w-full h-full border-b border-black flex flex-row items-center justify-between">
    <a href="/">パターンに基づく</a>
    <Hamburger open={props.sidePaneOpen} />
  </header>
});