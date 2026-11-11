/** Invalidate before aborting so even transports that ignore AbortSignal cannot commit stale state. */
export type RequestRunner = <T>(
  signal: AbortSignal,
  task: () => Promise<T>,
) => Promise<T>;

/** A workspace keeps one queue across session and report changes, including old transports still finishing. */
export function createLoadQueue(limit = 2) {
  const cancelled = () =>
    Object.assign(new Error("请求已取消"), { name: "AbortError" });
  let active = 0;
  const pending: {
    signal: AbortSignal;
    start: () => void;
    cancel: () => void;
  }[] = [];
  const pump = () => {
    while (active < limit && pending.length) {
      const job = pending.shift()!;
      job.signal.removeEventListener("abort", job.cancel);
      if (job.signal.aborted) {
        job.cancel();
        continue;
      }
      active++;
      job.start();
    }
  };
  return {
    run<T>(signal: AbortSignal, task: () => Promise<T>): Promise<T> {
      if (signal.aborted) return Promise.reject(cancelled());
      return new Promise((resolve, reject) => {
        const job = {
          signal,
          cancel: () => {
            const index = pending.indexOf(job);
            if (index >= 0) pending.splice(index, 1);
            signal.removeEventListener("abort", job.cancel);
            reject(cancelled());
          },
          start: () => {
            Promise.resolve()
              .then(() => {
                if (signal.aborted) throw cancelled();
                return task();
              })
              .then(resolve, reject)
              .finally(() => {
                active--;
                pump();
              });
          },
        };
        signal.addEventListener("abort", job.cancel, { once: true });
        pending.push(job);
        pump();
      });
    },
  };
}
export class Operation {
  constructor(private runner?: RequestRunner) {}
  private revision = 0;
  private controller?: AbortController;
  begin() {
    this.cancel();
    const revision = this.revision;
    this.controller = new AbortController();
    const signal = this.controller.signal;
    const current = () => revision === this.revision && !signal.aborted;
    return {
      signal,
      current,
      run: <T>(task: () => Promise<T>): Promise<T> => {
        if (!current()) return Promise.reject(new Error("请求已取消"));
        const checked = () => {
          if (!current()) throw new Error("请求已取消");
          return task();
        };
        return this.runner ? this.runner(signal, checked) : checked();
      },
      check: () => {
        if (!current()) throw new Error("请求已取消");
      },
    };
  }
  cancel() {
    this.revision++;
    this.controller?.abort();
  }
}
export type Ticket = ReturnType<Operation["begin"]>;
