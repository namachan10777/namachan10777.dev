import { type Signal, component$ } from "@builder.io/qwik";
import OpenSearchDialog from "../button/open-search-dialog";
import NavLinks from "./nav-links";
import { navItems } from "./nav-menu";
import { Link } from "@builder.io/qwik-city";

export type Props = {
  showSearchDialog: Signal<boolean>;
};

export default component$((props: Props) => {
  return (
    <nav class="flex h-full w-full flex-col gap-2  p-4">
      <div class="py-2">
        <h2 class="text-xl font-bold underline">
          <Link href="/">namachan10777.dev</Link>
        </h2>
      </div>
      <div class="border-b border-black pb-4">
        <OpenSearchDialog show={props.showSearchDialog} />
      </div>
      <NavLinks items={navItems} />
    </nav>
  );
});
