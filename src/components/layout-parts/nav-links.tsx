import type { NavItem, SubNavItem } from "./nav-menu";

export type Props = {
  items: NavItem[];
  title?: string;
};

const SubMenu = (props: { items: SubNavItem[] }) => {
  return (
    <ul class="contents">
      {props.items.map((item) => (
        <li class="col-start-2 text-lg text-gray-800 underline" key={item.href}>
          <a href={item.href}>{item.title}</a>
        </li>
      ))}
    </ul>
  );
};

const Item = (props: { item: NavItem }) => {
  return (
    <li class="col-span-2 grid grid-cols-[subgrid] items-center gap-1 border-t border-black py-4 first:border-none">
      <a href={props.item.href} class="contents">
        <props.item.icon class="text-xl" />
        <span class="text-xl font-bold underline">{props.item.title}</span>
      </a>
      {props.item.submenu ? <SubMenu items={props.item.submenu} /> : null}
    </li>
  );
};

export default (props: Props) => {
  return (
    <section class="grid w-full grid-cols-[2rem_1fr] flex-col">
      <nav class="contents">
        <ul class="contents">
          {props.title ? (
            <li>
              <h2 class="col-start-2 py-4 text-xl font-bold text-gray-600">
                {props.title}
              </h2>
            </li>
          ) : null}
          {props.items.map((item) => (
            <Item key={item.href} item={item} />
          ))}
        </ul>
      </nav>
    </section>
  );
};
