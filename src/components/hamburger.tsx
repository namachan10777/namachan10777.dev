import { menuTopicDef } from "@lib/global-topic";
import { createTopic } from "@lib/topic/solid";
import { IoMenu, IoClose } from "solid-icons/io";
import type { Component } from "solid-js";

export const ToggleButton: Component = () => {
  const [open, setOpen] = createTopic(menuTopicDef);

  return (
    <button onClick={() => setOpen((open) => !open)}>
      {open() ? <IoClose class="text-2xl" /> : <IoMenu class="text-2xl" />}
    </button>
  );
};
