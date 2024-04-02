import type { EventBusElement, Event } from "./event-bus";
import { isServer } from "solid-js/web";

export class EventBus {
  bus: EventBusElement | null;
  delayedSubscribeRequests: Map<string, ((event: Event) => void)[]>;
  delayedEmitRequests: Event[];

  constructor(id: string) {
    this.bus = null;
    this.delayedSubscribeRequests = new Map();
    this.delayedEmitRequests = [];

    if (!isServer) {
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
