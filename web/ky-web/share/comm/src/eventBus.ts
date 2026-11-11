type EventCallback = (...args: unknown[]) => void;

export class EventBus {
  private events = new Map<string, Set<EventCallback>>();

  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    this.events.get(event)?.delete(callback);
  }

  emit(event: string, ...args: unknown[]): void {
    this.events.get(event)?.forEach((cb) => cb(...args));
  }
}

const GLOBAL_KEY = "__MF_EVENT_BUS__" as const;

declare global {
  interface Window {
    [GLOBAL_KEY]?: EventBus;
  }
}

if (!window[GLOBAL_KEY]) {
  window[GLOBAL_KEY] = new EventBus();
}

export const eventBus: EventBus = window[GLOBAL_KEY]!;
