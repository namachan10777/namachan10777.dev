import { Slot, component$ } from "@builder.io/qwik";

export type Props = {
  depth: 1 | 2 | 3 | 4 | 5 | 6;
};

export default component$((props: Props) => {
  const gap = (() => {
    switch (props.depth) {
      case 1:
        return "gap-5";
      case 2:
        return "gap-4";
      case 3:
        return "gap-3";
      default:
        return "gap-2";
    }
  })();
  return (
    <section class={["py-4", "flex", "flex-col", gap]}>
      <Slot />
    </section>
  );
});
