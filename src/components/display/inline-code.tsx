import { Slot, component$ } from "@builder.io/qwik";

export default component$(() => {
  return (
    <code class="rounded-sm bg-gray-200 p-1 font-mono">
      <Slot />
    </code>
  );
});
