import { Topic } from "./types";
import type { TopicDef } from "./types";

import * as Node from "./node";
import * as Browser from "./browser";

export class Topics {
  topics: Map<string, Topic<any>>;

  constructor(name: string) {
    if (typeof window !== "undefined") {
      this.topics = Browser.getStore(name);
    } else {
      this.topics = Node.getStore(name);
    }
  }

  topic<T>(def: TopicDef<T>): Topic<T> {
    const topic: Topic<T> | undefined = this.topics.get(def.id);
    if (topic) {
      return topic;
    } else {
      const topic = new Topic(def.value);
      this.topics.set(def.id, topic);
      return topic as Topic<T>;
    }
  }
}

export type { TopicDef };
export { Topic };
