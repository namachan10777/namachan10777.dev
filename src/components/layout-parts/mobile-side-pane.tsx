import { component$ } from "@builder.io/qwik";
import { navItems } from "./nav-menu";

export default component$(() => {
  return (
    <nav class="flex h-full w-full flex-col border-l border-black bg-white">
      <ul>
        {navItems.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              class="flex flex-row items-center gap-2 text-xl"
            >
              <item.icon />
              <span>{item.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
});
