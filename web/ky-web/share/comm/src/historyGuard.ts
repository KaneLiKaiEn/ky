export interface HistoryNavigationGuard {
  isBlocked: () => boolean;
  getIndex: () => number;
  confirm: () => Promise<boolean>;
}

type PendingPop = {
  guard: HistoryNavigationGuard;
  origin: number;
  target: number;
  confirming: boolean;
};

let active: HistoryNavigationGuard | undefined;
let pending: PendingPop | undefined;
let approved: { guard: HistoryNavigationGuard; index: number } | undefined;
const browserWindow = typeof window === "undefined" ? undefined : window;

function confirmPop(operation: PendingPop) {
  if (operation.confirming) return;
  operation.confirming = true;
  void operation.guard.confirm().catch(() => false).then((allowed) => {
    if (pending !== operation || active !== operation.guard || !browserWindow) return;
    pending = undefined;
    if (allowed && operation.target !== operation.origin) {
      approved = { guard: operation.guard, index: operation.target };
      browserWindow.history.go(operation.target - operation.origin);
    }
  });
}

/** Loaded by comm/session before BrowserRouter installs its history listener. */
browserWindow?.addEventListener("popstate", (event: PopStateEvent) => {
  const index = event.state?.idx;
  if (!Number.isSafeInteger(index)) return;
  if (approved) {
    const canPass = approved.guard === active && approved.index === index;
    approved = undefined;
    if (canPass) return;
  }
  if (!active || !active.isBlocked()) return;
  if (pending?.guard !== active) pending = undefined;
  if (pending) {
    event.stopImmediatePropagation();
    if (index === pending.origin) confirmPop(pending);
    else {
      pending.target = index;
      browserWindow.history.go(pending.origin - index);
    }
    return;
  }
  const origin = active.getIndex();
  if (!Number.isSafeInteger(origin) || origin === index) return;
  event.stopImmediatePropagation();
  pending = { guard: active, origin, target: index, confirming: false };
  browserWindow.history.go(origin - index);
}, true);

export function registerHistoryNavigationGuard(guard: HistoryNavigationGuard): () => void {
  active = guard;
  pending = undefined;
  approved = undefined;
  return () => {
    if (active !== guard) return;
    active = undefined;
    pending = undefined;
    approved = undefined;
  };
}
