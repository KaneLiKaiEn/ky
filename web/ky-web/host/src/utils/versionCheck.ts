import { resolveEntryUrl } from "@/config/resolveEntryUrl";

/** versionUrl -> 当前页面运行中的版本 */
const baselines = new Map<string, string>();

const CALLBACK_PREFIX = "__appVersionCb_";
let callbackSeq = 0;

type VersionCallback = (version: unknown) => void;

/** 用 script 加载，Network 里归到 JS，不出现在 Fetch/XHR */
const loadVersion = (url: string): Promise<string | undefined> =>
  new Promise((resolve) => {
    const callbackName = `${CALLBACK_PREFIX}${++callbackSeq}`;
    const versionWindow = window as unknown as Record<string, VersionCallback | undefined>;
    let settled = false;

    const finish = (version?: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      delete versionWindow[callbackName];
      script.remove();
      resolve(version);
    };

    const timer = window.setTimeout(() => finish(), 5000);

    versionWindow[callbackName] = (version: unknown) => {
      finish(typeof version === "string" ? version : undefined);
    };

    const script = document.createElement("script");
    script.async = true;
    const joiner = url.includes("?") ? "&" : "?";
    script.src = `${url}${joiner}cb=${callbackName}&t=${Date.now()}`;
    script.onload = () => queueMicrotask(() => finish());
    script.onerror = () => finish();
    document.head.appendChild(script);
  });

/** version.js 与 remote 入口文件同级输出 */
const toVersionUrl = (entry: string): string =>
  new URL("version.js", resolveEntryUrl(entry)).href;

baselines.set(toVersionUrl(`${window.location.origin}/`), __APP_VERSION__);

/** 以首次加载时线上的版本作为该 remote 的基准 */
export const trackRemoteVersion = async (entry: string): Promise<void> => {
  if (!entry) return;
  const url = toVersionUrl(entry);
  if (baselines.has(url)) return;
  const version = await loadVersion(url);
  if (version && !baselines.has(url)) baselines.set(url, version);
};

void trackRemoteVersion(import.meta.env.VITE_COMM_ENTRY || "http://localhost:4172/comm.js");
void trackRemoteVersion(import.meta.env.VITE_WIDGET_ENTRY || "http://localhost:4186/widget.js");

export const hasNewVersion = async (): Promise<boolean> => {
  const results = await Promise.all(
    [...baselines].map(async ([url, current]) => {
      const latest = await loadVersion(url);
      return latest !== undefined && latest !== current;
    }),
  );
  return results.some(Boolean);
};
