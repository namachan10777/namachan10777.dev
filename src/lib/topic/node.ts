import { Topic } from "./types";

export function getStore(name: string): Map<string, Topic<unknown>> {
  const globalObject = global as unknown as {
    [key: string]: Map<string, Topic<unknown>> | undefined;
  };
  const slot = globalObject[name];
  if (slot) {
    return slot;
  } else {
    const store = new Map<string, Topic<unknown>>();
    globalObject[name] = store;
    return store;
  }
}
