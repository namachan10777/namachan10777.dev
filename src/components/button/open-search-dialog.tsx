import { Signal, component$ } from "@builder.io/qwik";

export type Props = {
  show: Signal<boolean>;
};

export default component$((props: Props) => {
  return (
    <button
      onClick$={() => {
        props.show.value = true;
      }}
    >
      Show dialog
    </button>
  );
});
