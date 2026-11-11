const DEFAULT_REMOTE_DOWNLOAD_BASE =
  "https://xmhis.top:30021/downloads/agent";
const LOCAL_AGENT_INIT = "http://localhost:7890/init";

type NavigatorWithUAData = Navigator & {
  userAgentData?: { platform?: string };
};

type SessionTask =
  | { status: "pending"; controller: AbortController }
  | { status: "sent" };

/** pending：正在拉校验文件；sent：已发出 /init，本机失败不重试。 */
const sessions = new Map<string, SessionTask>();

const isPhone = (): boolean => {
  const ua = navigator.userAgent;
  if (/iPhone|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(ua)) {
    return true;
  }
  return /Android/i.test(ua) && /Mobile/i.test(ua);
};

const platformName = (): string => {
  const nav = navigator as NavigatorWithUAData;
  const fromUAData = nav.userAgentData?.platform;
  if (fromUAData) return fromUAData.toLowerCase();

  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  return (navigator.platform || "").toLowerCase();
};

/** 手机与无法识别的系统返回 null。 */
const launcherMd5File = (): string | null => {
  if (isPhone()) return null;

  const platform = platformName();
  if (/mac|iphone|ipad|ipod/.test(platform)) return "launch.app.zip.md5";
  if (/win/.test(platform)) return "launch.exe.md5";
  if (/linux/.test(platform)) return "launch.md5";
  return null;
};

const agentDownloadBase = (): string => {
  const override = import.meta.env.VITE_AGENT_DOWNLOAD_BASE?.trim();
  if (override) return override.replace(/\/$/, "");

  const { protocol, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return DEFAULT_REMOTE_DOWNLOAD_BASE;
  }
  return `${protocol}//${hostname}:30021/downloads/agent`;
};

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

const warn = (message: string): void => {
  console.warn(`[启动器] ${message}`);
};

const isCurrentPending = (
  sessionId: string,
  controller: AbortController,
): boolean => {
  const task = sessions.get(sessionId);
  return task?.status === "pending" && task.controller === controller;
};

const abortOtherPending = (sessionId: string): void => {
  for (const [id, task] of sessions) {
    if (id === sessionId || task.status !== "pending") continue;
    task.controller.abort();
    sessions.delete(id);
  }
};

/** 读取校验文件正文。中止或失败返回 null，中止不打印。 */
const readChecksum = async (
  url: string,
  signal: AbortSignal,
): Promise<string | null> => {
  try {
    const res = await fetch(url, { signal });
    if (signal.aborted) return null;
    if (res.status !== 200) {
      warn(`校验未通过：无法读取校验文件（HTTP ${res.status}）`);
      return null;
    }

    const md5 = (await res.text()).trim();
    if (signal.aborted) return null;
    if (!md5) {
      warn("校验未通过：校验文件内容为空");
      return null;
    }
    return md5;
  } catch (error) {
    if (signal.aborted || isAbortError(error)) return null;
    warn("校验未通过：无法读取校验文件");
    return null;
  }
};

/** 通知本机启动器。server 保持原文，与现有代理的 query 写法一致。 */
const notifyAgent = (
  downloadBase: string,
  md5: string,
  sessionId: string,
): void => {
  const initUrl =
    `${LOCAL_AGENT_INIT}?server=${downloadBase}` +
    `&md5=${encodeURIComponent(md5)}` +
    `&session_id=${encodeURIComponent(sessionId)}`;

  void fetch(initUrl, {
    headers: { "Xmhis-Session-Id": sessionId },
  })
    .then((res) => {
      if (!res.ok) {
        warn(`初始化未完成：本机代理返回异常（HTTP ${res.status}）`);
      }
    })
    .catch(() => {
      warn("初始化未完成：未连接到本机启动器，请确认已安装并已开启");
    });
};

const runInit = async (
  sessionId: string,
  fileName: string,
  controller: AbortController,
): Promise<void> => {
  const downloadBase = agentDownloadBase();
  const md5 = await readChecksum(
    `${downloadBase}/${fileName}`,
    controller.signal,
  );

  if (!isCurrentPending(sessionId, controller)) return;

  if (!md5) {
    sessions.delete(sessionId);
    return;
  }

  notifyAgent(downloadBase, md5, sessionId);
  sessions.set(sessionId, { status: "sent" });
};

/** 取消尚未完成的校验请求。已发出的 /init 不撤回。 */
export const cancelLauncherInit = (): void => {
  for (const [id, task] of sessions) {
    if (task.status !== "pending") continue;
    task.controller.abort();
    sessions.delete(id);
  }
};

/** 当前会话初始化一次。手机与无法识别的系统直接跳过。 */
export const initLauncher = (sessionId: string): void => {
  const fileName = launcherMd5File();
  if (!sessionId || !fileName) return;

  abortOtherPending(sessionId);

  const current = sessions.get(sessionId);
  if (current?.status === "sent" || current?.status === "pending") return;

  const controller = new AbortController();
  sessions.set(sessionId, { status: "pending", controller });
  void runInit(sessionId, fileName, controller);
};
