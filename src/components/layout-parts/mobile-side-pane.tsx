import { component$ } from "@builder.io/qwik";
import { navItems } from "./nav-menu";

export default component$(() => {
  return (
    <nav class="flex h-full w-full flex-col border-l border-black">
      <ul>
        {navItems.map((item) => (
          <li key={item.href}>
            <a href={item.href}>
              <item.icon />
              <span>{item.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
});
