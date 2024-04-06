import { component$ } from "@builder.io/qwik";
import NavLinks from "./nav-links";
import { navItems } from "./nav-menu";

export default component$(() => {
  return (
    <div class="h-full border-l border-black bg-white p-4">
      <NavLinks items={navItems} title="Links" />
    </div>
  );
});
