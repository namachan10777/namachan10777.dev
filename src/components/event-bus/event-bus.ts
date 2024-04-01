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
  message?: any;
};

export class Bus {
  bus: EventBusElement | null;
  handlers: Map<string, ((event: Event) => void)[]>;

  constructor(id: string) {
    this.handlers = new Map();
    this.bus = null;
    const self = this;
    customElements.whenDefined("event-bus").then(() => {
      self.bus = document.getElementById(id) as EventBusElement;
      for (const [key, handlers] of this.handlers.entries()) {
        for (const handler of handlers) {
          self.bus.subscribe(key, handler);
        }
      }
    });
  }

  emit(event: Event) {
    if (this.bus) {
      this.bus.emit(event);
    }
  }

  subscribe(event_name: string, handler: (ev: Event) => void) {
    if (this.bus) {
      this.bus.subscribe(event_name, handler);
    } else {
      const handlers = this.handlers.get(event_name);
      if (handlers) {
        handlers.push(handler);
      } else {
        this.handlers.set(event_name, [handler]);
      }
    }
  }
}
