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

export class EventBus {
  bus: EventBusElement | null;
  delayedSubscribeRequests: Map<string, ((event: Event) => void)[]>;
  delayedEmitRequests: Event[];

  constructor(id: string) {
    this.bus = null;
    this.delayedSubscribeRequests = new Map();
    this.delayedEmitRequests = [];

    customElements.whenDefined("event-bus").then(() => {
      this.bus = document.getElementById(id) as EventBusElement;
      for (const [key, handlers] of this.delayedSubscribeRequests.entries()) {
        for (const handler of handlers) {
          this.bus.subscribe(key, handler);
        }
      }
      for (const event of this.delayedEmitRequests) {
        this.bus.emit(event);
      }
    });
  }

  emit(event: Event) {
    if (this.bus) {
      this.bus.emit(event);
    } else {
      this.delayedEmitRequests.push(event);
    }
  }

  subscribe(event_name: string, handler: (ev: Event) => void) {
    if (this.bus) {
      this.bus.subscribe(event_name, handler);
    } else {
      const handlers = this.delayedSubscribeRequests.get(event_name);
      if (handlers) {
        handlers.push(handler);
      } else {
        this.delayedSubscribeRequests.set(event_name, [handler]);
      }
    }
  }
}
