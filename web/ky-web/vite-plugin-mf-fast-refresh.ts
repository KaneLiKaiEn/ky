/**
 * Module Federation 会给 import 了 remote 的模块注入
 * `export const __mf_remote_dependency_pending`。
 * React Fast Refresh 把它当成非组件导出，从而整页 reload。
 *
 * 利用 plugin-react 的 ignoredExports 机制忽略该导出。
 */
const MF_PENDING_EXPORT = "__mf_remote_dependency_pending";

const RUNTIME_IGNORED_EXPORTS =
  "const ignoredExports = window.__getReactRefreshIgnoredExports?.({ id }) ?? []";

const RUNTIME_IGNORED_EXPORTS_PATCHED = `const ignoredExports = ["${MF_PENDING_EXPORT}", ...(window.__getReactRefreshIgnoredExports?.({ id }) ?? [])]`;

export function mfFastRefreshCompat() {
  return {
    name: "mf-fast-refresh-compat",
    apply: "serve" as const,
    enforce: "post" as const,
    transform(code: string) {
      if (!code.includes("validateRefreshBoundaryAndEnqueueUpdate")) return;
      if (!code.includes(RUNTIME_IGNORED_EXPORTS)) return;
      return {
        code: code.replace(
          RUNTIME_IGNORED_EXPORTS,
          RUNTIME_IGNORED_EXPORTS_PATCHED,
        ),
        map: null,
      };
    },
    transformIndexHtml() {
      return [
        {
          tag: "script",
          children: `(function(){var prev=window.__getReactRefreshIgnoredExports;window.__getReactRefreshIgnoredExports=function(args){return ["${MF_PENDING_EXPORT}"].concat((typeof prev==="function"?prev(args):[])||[])}})();`,
        },
      ];
    },
  };
}
