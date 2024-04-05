import { Signal, component$ } from "@builder.io/qwik";

export type Props = {
  open: Signal<boolean>,
};

export default component$((props: Props) => {
  return <button class="h-8" onClick$={() => { props.open.value = !props.open.value }}>
    {props.open.value ? "opened" : "closed"}
  </button>
});
