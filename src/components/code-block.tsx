import { Slot, component$ } from "@builder.io/qwik";

export const CodeBlock = component$(() => {
  return (
    <pre>
      <Slot />
    </pre>
  );
});
