export const aborted = () => new DOMException("请求已取消", "AbortError");
export function checkSignal(signal: AbortSignal) {
  if (signal.aborted) throw aborted();
}
interface Pending {
  signal: AbortSignal;
  run: () => Promise<unknown>;
  resolve: (value: any) => void;
  reject: (reason: unknown) => void;
  detach: () => void;
}
/** One queue is shared by the main board, backgrounds, raw data and detail dialogs. */
export function createLoadQueue(limit = 2) {
  let active = 0;
  const pending: Pending[] = [];
  const pump = () => {
    while (active < limit && pending.length) {
      const task = pending.shift()!;
      task.detach();
      if (task.signal.aborted) {
        task.reject(aborted());
        continue;
      }
      active++;
      Promise.resolve()
        .then(task.run)
        .then(task.resolve, task.reject)
        .finally(() => {
          active--;
          pump();
        });
    }
  };
  return {
    run<T>(signal: AbortSignal, run: () => Promise<T>): Promise<T> {
      if (signal.aborted) return Promise.reject(aborted());
      return new Promise((resolve, reject) => {
        const cancel = () => {
          const index = pending.indexOf(task);
          if (index >= 0) {
            pending.splice(index, 1);
            reject(aborted());
          }
        };
        const task: Pending = {
          signal,
          run,
          resolve,
          reject,
          detach: () => signal.removeEventListener("abort", cancel),
        };
        signal.addEventListener("abort", cancel, { once: true });
        pending.push(task);
        pump();
      });
    },
  };
}
export type LoadQueue = ReturnType<typeof createLoadQueue>;
export type RequestRunner = LoadQueue["run"];
export interface PreviewTarget {
  depth?: number;
  type: "BOARD" | "REPORT";
  id: number;
  title?: string;
  argList: { arg_code: string; arg_type: string; arg_value: string }[];
}

/** A deadline scheduler coalesces board and component refreshes; hidden time is never replayed. */
export function createRefreshScheduler(
  boardSeconds: number,
  components: { id: number; seconds: number }[],
  refresh: (ids?: number[]) => void,
  env: {
    now: () => number;
    setTimer: (fn: () => void, delay: number) => unknown;
    clearTimer: (id: any) => void;
    hidden: () => boolean;
    listen: (fn: () => void) => () => void;
  },
) {
  const intervals = new Map<number, number>();
  if (Number.isFinite(boardSeconds) && boardSeconds > 0)
    intervals.set(0, boardSeconds * 1000);
  for (const c of components)
    if (Number.isFinite(c.seconds) && c.seconds > 0)
      intervals.set(c.id, c.seconds * 1000);
  let stopped = false,
    timer: unknown;
  const deadlines = new Map<number, number>();
  const reset = () => {
    deadlines.clear();
    for (const [id, ms] of intervals) deadlines.set(id, env.now() + ms);
  };
  const schedule = () => {
    env.clearTimer(timer);
    if (stopped || env.hidden() || !deadlines.size) return;
    timer = env.setTimer(
      tick,
      Math.max(1, Math.min(...deadlines.values()) - env.now()),
    );
  };
  const tick = () => {
    if (stopped || env.hidden()) return;
    const due: number[] = [];
    for (const [id, time] of deadlines)
      if (time <= env.now()) {
        due.push(id);
        deadlines.set(id, env.now() + intervals.get(id)!);
      }
    if (due.includes(0)) refresh();
    else if (due.length) refresh(due);
    schedule();
  };
  const unlisten = env.listen(() => {
    reset();
    schedule();
  });
  reset();
  schedule();
  return () => {
    stopped = true;
    env.clearTimer(timer);
    unlisten();
    deadlines.clear();
  };
}
