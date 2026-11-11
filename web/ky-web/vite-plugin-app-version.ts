import { execSync } from "node:child_process";

/**
 * 构建版本号：注入 `__APP_VERSION__`，并在产物根目录输出 `version.js`。
 * Host 用 script 标签加载它做发版检测，请求归在 JS 而不是 Fetch/XHR。
 * 优先使用环境变量 APP_VERSION，否则为「构建时间-git 短哈希」。
 */
const resolveVersion = (): string => {
  if (process.env.APP_VERSION) return process.env.APP_VERSION;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
  try {
    const hash = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return hash ? `${time}-${hash}` : time;
  } catch {
    return time;
  }
};

export function appVersion() {
  const version = resolveVersion();

  return {
    name: "app-version",
    config: () => ({
      define: { __APP_VERSION__: JSON.stringify(version) },
    }),
    generateBundle(this: { emitFile: (file: { type: "asset"; fileName: string; source: string }) => void }) {
      const payload = JSON.stringify(version);
      this.emitFile({
        type: "asset",
        fileName: "version.js",
        source: `(function(){var s=document.currentScript;if(!s||!s.src)return;var cb=new URL(s.src,location.href).searchParams.get("cb");if(!cb||!/^__appVersionCb_\\d+$/.test(cb))return;var fn=window[cb];if(typeof fn==="function")fn(${payload});})();`,
      });
    },
  };
}
