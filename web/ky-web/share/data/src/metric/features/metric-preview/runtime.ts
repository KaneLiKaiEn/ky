const cancelled = () => new DOMException("请求已取消", "AbortError");
interface Job {
  key: string;
  controller: AbortController;
  users: Set<symbol>;
  run: (signal: AbortSignal) => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  promise: Promise<unknown>;
}
export type RequestRunner = <T>(
  signal: AbortSignal,
  task: () => Promise<T>,
) => Promise<T>;
/** The host runner also bounds requests made by embedded boards and reports. */
export function createRuntime(limit = 2, runner?: RequestRunner) {
  let active = 0;
  const jobs = new Map<string, Job>(),
    pending: Job[] = [];
  const pump = () => {
    while (active < limit && pending.length) {
      const job = pending.shift()!;
      if (job.controller.signal.aborted) {
        job.reject(cancelled());
        continue;
      }
      active++;
      void Promise.resolve()
        .then(() =>
          runner
            ? runner(job.controller.signal, () =>
                job.run(job.controller.signal),
              )
            : job.run(job.controller.signal),
        )
        .then(job.resolve, job.reject)
        .finally(() => {
          active--;
          if (jobs.get(job.key) === job) jobs.delete(job.key);
          pump();
        });
    }
  };
  return {
    read<T>(
      key: string,
      run: (signal: AbortSignal) => Promise<T>,
      signal: AbortSignal,
    ): Promise<T> {
      if (signal.aborted) return Promise.reject(cancelled());
      let job = jobs.get(key);
      if (!job || job.controller.signal.aborted) {
        let resolve!: Job["resolve"], reject!: Job["reject"];
        const promise = new Promise<unknown>((yes, no) => {
          resolve = yes;
          reject = no;
        });
        job = {
          key,
          run,
          promise,
          resolve,
          reject,
          users: new Set(),
          controller: new AbortController(),
        };
        jobs.set(key, job);
        pending.push(job);
      }
      const current = job,
        user = Symbol();
      current.users.add(user);
      const result = new Promise<T>((resolve, reject) => {
        const detach = () => {
          signal.removeEventListener("abort", abort);
          current.users.delete(user);
          if (!current.users.size) {
            current.controller.abort();
            const index = pending.indexOf(current);
            if (index >= 0) {
              pending.splice(index, 1);
              current.reject(cancelled());
            }
            if (jobs.get(key) === current) jobs.delete(key);
          }
        };
        const abort = () => {
          detach();
          reject(cancelled());
        };
        signal.addEventListener("abort", abort, { once: true });
        current.promise.then(
          (value) => {
            detach();
            if (!signal.aborted) resolve(value as T);
          },
          (error) => {
            detach();
            if (!signal.aborted) reject(error);
          },
        );
      });
      pump();
      return result;
    },
  };
}
export type Runtime = ReturnType<typeof createRuntime>;

/** One timer, no overlap, and no replay of ticks missed while hidden. */
export function autoRefresh(
  run: () => Promise<unknown>,
  milliseconds: number,
  env = {
    hidden: () => document.hidden,
    listen: (fn: () => void) => {
      document.addEventListener("visibilitychange", fn);
      return () => document.removeEventListener("visibilitychange", fn);
    },
    timer: (fn: () => void, delay: number) => setTimeout(fn, delay),
    clear: (timer: ReturnType<typeof setTimeout> | undefined) =>
      clearTimeout(timer),
  },
) {
  let stopped = false,
    running = false,
    timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    env.clear(timer);
    if (!stopped && !running && !env.hidden())
      timer = env.timer(tick, milliseconds);
  };
  const tick = async () => {
    if (stopped || env.hidden()) return;
    running = true;
    try {
      await run();
    } catch {
      /* the read owns its error state */
    } finally {
      running = false;
      schedule();
    }
  };
  const unlisten = env.listen(schedule);
  schedule();
  return () => {
    stopped = true;
    env.clear(timer);
    unlisten();
  };
}
