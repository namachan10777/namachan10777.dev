import { Slot, component$ } from "@builder.io/qwik";

export default component$(() => {
  return (
    <p class="leading-relaxed text-gray-800">
      <Slot />
    </p>
  );
});
