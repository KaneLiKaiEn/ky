/** 在业务组件求值之前预热共享请求、会话与主题模块。 */
export async function preloadRemotes(): Promise<void> {
  await Promise.all([
    import("comm/request"),
    import("comm/resource"),
    import("comm/management"),
    import("comm/utils"),
    import("comm/session"),
    import("comm/theme"),
  ]);
}
