import { component$ } from "@builder.io/qwik";
import { NavItem, SubNavItem, navItems } from "./nav-menu";
import Icon from "~/assets/icon.webp?jsx";

const SubMenu = (props: { items: SubNavItem[] }) => {
  return (
    <ul class="contents">
      {props.items.map((item) => (
        <li class="col-start-2 text-lg underline" key={item.href}>
          <a href={item.href}>{item.title}</a>
        </li>
      ))}
    </ul>
  );
};

const Item = (props: { item: NavItem }) => {
  return (
    <li class="col-span-2 grid grid-cols-[subgrid] items-center gap-2 border-t border-black py-4">
      <a href={props.item.href} class="contents">
        <props.item.icon class="text-xl" />
        <span class="text-xl font-bold underline">{props.item.title}</span>
      </a>
      {props.item.submenu ? <SubMenu items={props.item.submenu} /> : null}
    </li>
  );
};

export default component$(() => {
  return (
    <div class="h-full border-l border-black bg-white p-4">
      <nav class="grid w-full  grid-cols-[2rem_1fr] flex-col">
        <h3 class="col-start-2 pb-4 text-xl font-bold text-gray-600">Links</h3>
        <ul class="contents">
          {navItems.map((item) => (
            <Item key={item.href} item={item} />
          ))}
        </ul>
      </nav>
    </div>
  );
});
