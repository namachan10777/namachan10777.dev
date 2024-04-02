/* eslint no-undef: 0 */

export class EventBusElement extends HTMLElement {
  handlers: Map<string, ((ev: Event) => void)[]>;

  constructor() {
    super();
    this.handlers = new Map();
  }

  emit(ev: Event) {
    const handlers = this.handlers.get(ev.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(ev);
      }
    }
  }

  subscribe(event_name: string, handler: (ev: Event) => void) {
    const handlers = this.handlers.get(event_name);
    if (handlers) {
      handlers.push(handler);
    } else {
      this.handlers.set(event_name, [handler]);
    }
  }
}

export type Event = {
  type: string;
};
