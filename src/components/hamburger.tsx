import { IoMenu, IoClose } from "solid-icons/io";
import { createSignal } from "solid-js";
import type { Component } from "solid-js";

export const Hamburger: Component = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  return <button onClick={() => setIsOpen((prev) => !prev)}>
    {isOpen() ? <IoClose class="text-2xl" /> : <IoMenu class="text-2xl" />}
  </button>
}
