/** 在求值含静态 `comm/*` / `visit/*` import 的模块之前，先把远程写入 MF 模块缓存。 */
export async function preloadRemotes(): Promise<void> {
  await Promise.all([
    import("comm/request"),
    import("comm/session"),
    import("comm/theme"),
    import("comm/moduleContext"),
    import("comm/navbarSlot"),
    import("comm/eventBus"),
    import("visit/emrContent"),
  ]);
}
