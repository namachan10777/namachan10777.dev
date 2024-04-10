import { type Signal, component$ } from "@builder.io/qwik";
import Hamburger from "../button/hamburger";

import Icon from "~/assets/icon.webp?jsx";
import { InSearch } from "@qwikest/icons/iconoir";
import { Link } from "@builder.io/qwik-city";

export type Props = {
  sidePaneOpen: Signal<boolean>;
  showSearch: Signal<boolean>;
};

export default component$((props: Props) => {
  return (
    <header class="flex h-full w-full flex-row items-center justify-between border-b border-black bg-white px-2">
      <Link class="h-8 w-8" href="/">
        <Icon alt="ホームへ戻る" class="rounded-full" />
      </Link>
      <div class="flex flex-row gap-2">
        <button
          aria-label="検索ダイアログを開く"
          onClick$={() => {
            props.showSearch.value = true;
          }}
        >
          <InSearch class="text-2xl" />
        </button>
        <Hamburger open={props.sidePaneOpen} />
      </div>
    </header>
  );
});
