import { Signal, component$ } from "@builder.io/qwik";
import OpenSearchDialog from "../button/open-search-dialog";

export type Props = {
  showSearchDialog: Signal<boolean>;
};

export default component$((props: Props) => {
  return (
    <nav class="flex h-full w-full flex-col gap-2 border-r border-black">
      <span>Desktop Nav</span>
      <OpenSearchDialog show={props.showSearchDialog} />
    </nav>
  );
});
