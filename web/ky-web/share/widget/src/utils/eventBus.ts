type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback) {
    this.events.get(event)?.delete(callback);
  }

  emit(event: string, ...args: any[]) {
    this.events.get(event)?.forEach((cb) => cb(...args));
  }
}

const GLOBAL_KEY = '__MF_EVENT_BUS__';

if (!(window as any)[GLOBAL_KEY]) {
  (window as any)[GLOBAL_KEY] = new EventBus();
}

export const eventBus: EventBus = (window as any)[GLOBAL_KEY];
