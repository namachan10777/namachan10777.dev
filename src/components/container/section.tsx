import { Slot, component$ } from "@builder.io/qwik";

export default component$(() => {
  return (
    <section class="py-4">
      <Slot />
    </section>
  );
});
