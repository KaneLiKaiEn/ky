import { LatestRequest } from "./latestRequest";

export class EventScheduler<T> {
  private requests = new Map<string, LatestRequest>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private disposed = false;

  constructor(private dispatch: (payload: T, isCurrent: () => boolean) => Promise<void>, private delay = 300) {}

  schedule(key: string, payload: T, debounced: boolean): void {
    if (this.disposed) return;
    this.cancelTimer(key);
    const request = this.requests.get(key) ?? new LatestRequest();
    this.requests.set(key, request);
    const version = request.begin();
    const isCurrent = () => !this.disposed && request.isCurrent(version);
    const fire = () => {
      this.timers.delete(key);
      if (isCurrent()) void this.dispatch(payload, isCurrent);
    };
    if (debounced) this.timers.set(key, setTimeout(fire, this.delay));
    else fire();
  }

  invalidate(key: string): void {
    this.cancelTimer(key);
    this.requests.get(key)?.invalidate();
  }

  private cancelTimer(key: string): void {
    const timer = this.timers.get(key);
    if (timer !== undefined) clearTimeout(timer);
    this.timers.delete(key);
  }

  dispose(): void {
    this.disposed = true;
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.requests.clear();
  }
}
