export interface TopicDef<T> {
  id: string;
  value: T;
}

export function defineTopic<T>(value: T): TopicDef<T> {
  return {
    id: crypto.randomUUID(),
    value,
  };
}

export class Topic<T> {
  value: T;
  listeners: ((value: T) => void)[] = [];

  constructor(value: T) {
    this.value = value;
  }

  listen(callback: (value: T) => void) {
    this.listeners.push(callback);
  }

  unlisten(callback: (value: T) => void) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  read(): T | undefined {
    return this.value;
  }

  put(value: T) {
    this.value = value;
    console.log(this.listeners);
    for (const listener of this.listeners) {
      listener(value);
    }
  }
}
