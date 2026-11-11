// 异步壳：因为 MF remote（如 comm）会被构建器转成异步 import，
// 入口必须延后到下一轮，避免顶层同步依赖远程模块。
//
// @module-federation/vite 1.16+ 对「顶层静态 import 远程模块」采用惰性代理：
// 消费模块（App）求值时若远程尚未进入模块缓存，代理会抛出一个 pending Promise，
// 导致 App 模块求值失败、整个 bootstrap 被 reject → 白屏。
// 解决办法：在 App 求值前，先把 host 直接静态依赖的 comm 远程模块预加载进缓存。
async function start() {
  try {
    const loaded = await Promise.all([
      import("comm/request"),
      import("comm/session"),
      import("comm/theme"),
      import("comm/eventBus"),
      import("comm/moduleContext"),
    ]);
    // __mf_remote_pending 是 thenable，await 它会触发并等待远程真正加载完成、写入模块缓存
    await Promise.all(
      loaded.map((m) => (m as Record<string, unknown>)?.__mf_remote_pending ?? Promise.resolve()),
    );
  } catch (err) {
    console.error("[preload comm] failed:", err);
  }
  await import("@/bootstrap");
}

start();
