import { topics } from "@lib/global-topic";
import type { TopicDef } from "./types";
import { createSignal } from "solid-js";

export const createTopic = <T>(
  def: TopicDef<T>,
): [() => T, (setter: (value: T) => T) => void] => {
  const [get, set] = createSignal(def.value);
  const topic = topics.topic(def);
  topic.listen((value) => {
    set(() => value);
  });
  return [
    get,
    (setter) => {
      const value = setter(get());
      topic.put(value);
    },
  ];
};
