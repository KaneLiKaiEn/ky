# Comm 共享能力

## 主题

整页入口使用 `AppThemeProvider` 与 `AppThemeRoot`：前者默认 `mode="system"`、品牌色 `#1677ff`、基础圆角 6，接受 `primaryColor` 和原 ConfigProvider 配置；后者同步文档 CSS 变量、`data-theme` 与 `color-scheme`，卸载时恢复原值。`theme.algorithm` 统一由 mode 决定。

业务读取 `useAppTheme().resolvedMode`，局部主题用 `AppThemeScope`，Portal 使用 `useAppThemeStyle()` 注入 CSS 变量。仅有旧 ConfigProvider 的宿主按系统偏好兼容，非浏览器环境默认浅色。`AppThemeModeProvider` 供已经自行管理 AntD ConfigProvider 的预览适配器使用，必须同步设置对应算法。`usePrefersDarkMode` 仍表示操作系统偏好，不代表大屏等局部作用域。

`appThemeVars`、`AppThemeRoot`、`usePrefersDarkMode`、NotFound 等旧导出继续可用。公共 shell CSS 只由独立 bootstrap 引入，不随主题联邦入口加载。主题契约及使用约定见仓库开发规范。

通过现有 `comm.js` 联邦入口使用，无需注册新的远程服务：

| 入口              | 导出                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `comm/resource`   | `useResource`、`Resource<T>`、`ResourceOptions`、`ResourceState<T>`   |
| `comm/management` | 管理编辑器、会话、编辑守卫、工作区导航 hooks 及其接口类型             |
| `comm/utils`      | DTO 清理、ID/文本/结果工具、泛型目录树、Base64 文件转换、批量保存流程 |

`useResource(key, loader, { formatError? })` 的状态属于每个 hook 实例。`key = null` 禁用读取；相同 key 刷新保留旧快照，切换 key 隐藏旧数据。`ready` 要求已取得非 undefined 数据、读取完成且没有错误。

- `reloadData()` 等待读取并返回被当前资源接受的数据；失效请求返回 undefined，当前请求失败时拒绝。
- `reload()` 等待读取，返回 `Promise<void>`，当前请求失败时拒绝。
- `refresh()` 返回 void，合并同一轮渲染前的刷新请求，在后台读取并通过 `error` 暴露失败。
- `mutate(update)` 更新当前快照并使之前的读取失效。

board、metric、report 的管理 hooks 及其类型直接从 `comm/management` 导入。system、adverse-event 的适配层保留返回 void 的 `reload` 和原错误文案。应用专属的上传限制、目录选项、删除 ID 计算和删除前校验留在应用内。

会话 hook 复用现有 session/eventBus；页面编辑状态和资源快照不进入全局 store。comm 内部只使用相对导入。

## 类型与验证

消费包的新增 `comm/*` TypeScript 路径映射指向本仓 comm 源码，仅用于类型检查；Vite 运行时仍由联邦加载。`comm/eventBus` 同样解析到源码，避免同时引入两份带私有成员的 EventBus 类型。消费包的 `rootDir` 覆盖仓库根目录，让联邦声明生成包含这些跨包类型依赖，避免声明被写入共享源码目录。发布声明由构建输出到 `dist/@mf-types.zip`。

```sh
npm --prefix share/comm test
npm --prefix share/comm run typecheck
npm --prefix share/comm run build
npm --prefix remote/board test
npm --prefix remote/report test
```

浏览器预览通过 `tests/viteSources.ts` 使用真实共享源码，并在 request/session 边界接入各应用的 mock。共享行为测试位于 comm，应用测试继续验证业务协议。

真实联邦验证先运行 `npm --prefix share/comm run test:federation:build`，再分别在两个终端运行：

```sh
npm --prefix share/comm run preview -- --host 127.0.0.1 --port 4272 --strictPort
npm --prefix share/comm run test:federation
```

访问 `http://127.0.0.1:4273/`，点击“验证保存并离开”，再选择“保存并离开”。页面应显示“联邦验证通过”。该页面加载构建后的真实 `comm.js`，校验会话事件、资源 hook、React/Router/Ant Design 上下文和导航守卫；认证读取由本机 mock 响应。需要其他 comm 入口时，在构建测试页前设置 `COMM_SMOKE_ENTRY`。

主题改造发布顺序为 comm → data → Host 与消费应用；旧 comm 入口继续可用。

`useScopedWorkspaceNavigation(onDiscard?)` 聚合独立编辑作用域，离开页面时按深度保存。可选 `onDiscard` 在根导航放弃所有作用域后调用，用于宿主重置当前编辑页；单个作用域的关闭／放弃只影响该作用域，不调用宿主回调。
