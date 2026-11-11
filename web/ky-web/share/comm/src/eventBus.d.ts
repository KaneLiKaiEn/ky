type EventCallback = (...args: unknown[]) => void;
export declare class EventBus {
    private events;
    on(event: string, callback: EventCallback): () => void;
    off(event: string, callback: EventCallback): void;
    emit(event: string, ...args: unknown[]): void;
}
declare const GLOBAL_KEY: "__MF_EVENT_BUS__";
declare global {
    interface Window {
        [GLOBAL_KEY]?: EventBus;
    }
}
export declare const eventBus: EventBus;
export {};
