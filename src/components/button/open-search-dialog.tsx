import { Signal, component$ } from "@builder.io/qwik";
import { InSearch } from "@qwikest/icons/iconoir";

export type Props = {
  show: Signal<boolean>;
};

export default component$((props: Props) => {
  return (
    <button
      class="flex w-full flex-row items-center gap-2 rounded-sm border bg-gray-100 px-4 py-1 text-xl transition-colors hover:bg-gray-200"
      onClick$={() => {
        props.show.value = true;
      }}
    >
      <InSearch />
      <span class="text-gray-600">search...</span>
    </button>
  );
});
