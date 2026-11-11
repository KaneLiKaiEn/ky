# Data 共享模块

`data` 提供指标、看板、报表共用的数据分析能力。依赖方向为 `remote/metric | remote/board | remote/report → data → comm`。模块不依赖业务应用，不注册自身为 remote。

| MF 入口               | 能力                                                                           |
| --------------------- | ------------------------------------------------------------------------------ |
| `data/theme` | 管理主题预设、`dataThemeVars`、`useDataThemeStyle`、局部 `DataThemeScope` |
| `data/dataset-editor` | 数据集编辑弹窗、各配置面板及其类型；管理编辑器、属性表单和布局                 |
| `data/query-controls` | `UnitSelect`、`DateFields` 及 `UnitSource` 等类型                              |
| `data/metric-preview` | 默认导出嵌入指标；命名导出页面复用的 Context、视图、请求调度及查询辅助接口     |
| `data/board-preview`  | 默认导出嵌入看板；命名导出 `BoardView`、`ComponentPreview`、调度及展示辅助接口 |
| `data/report-preview` | 默认导出嵌入报表；命名导出 `ReportView`、钻取、调度及展示辅助接口              |

业务应用保留路由、目录导航和管理页面。共享功能内部使用本地模块引用，三类预览之间按需加载。请求统一使用 `comm/request`，会话统一使用 `comm/session` 和 `comm/management`。应用管理页面的 API 与 DTO 仍由应用维护；data 中的领域请求和 DTO 是其独立构建所需的私有依赖。

开发时先启动 `share/comm` 和 `share/data`，再启动任意一个业务应用。默认入口为 `http://localhost:4171/data.js`；生产资源部署在 `/data/`，入口为 `/data/data.js`。三个应用通过 `VITE_DATA_ENTRY` 配置该地址。

图表脚本和许可说明、PDF worker、CMaps、字体及解码器由 data 提供，路径根据 data 模块地址解析。发布时先部署 data，再更新三个业务应用；旧的业务 remote 共享入口已移除。

验证命令：`npm test`、`npm run typecheck`、`npm run build`。浏览器场景保留在三个应用的 tests/browser 或 tests/preview 中，直接消费相同的 data 源码；发布前还应验证真实 MF 加载和生产资源路径。

真实 MF 回归：先构建 `comm`、`data`、Host 和三个应用，再执行 `npm run test:federation`。测试启动临时本地服务器，以内存后端数据验证每个应用在其他两个应用离线时的运行、嵌入预览、钻取、PDF 和数据集编辑器；并验证实际 Host 内三种品牌色、系统浅深色切换、应用切换和报表导航抽屉/关联弹窗，确认根主题和文档样式不被 remote 改写。macOS 默认使用已安装的 Google Chrome；其他环境通过 `CHROME_PATH` 指定浏览器可执行文件。可通过 `SMOKE_SCREENSHOTS` 指定已有目录保存截图。

管理页统一在 `ConfigProvider theme={managementTheme}` 内使用 `DataThemeScope`，可嵌入组件与 Portal 通过 `useDataThemeStyle()` 获取当前 token 对应的变量。旧 `data/board-preview` 的 `useManagementStyle` 保留为兼容入口。`data/theme` 不加载业务预览、请求或图表；data 内部使用相对引用，业务应用在预热阶段加载 `data/theme`。

`npm run test:theme:browser` 验证系统模式更新、六组品牌与明暗组合、局部主题、嵌套弹窗、签收行、共享 visit 工具样式、移动登录页，以及三种深色背景下看板主体/背景请求与缓存失效。先安装 host 与 data 依赖；测试使用 host 已有 Tailwind 插件编译真实应用样式。基础主题改动的发布顺序为 comm → data → Host/业务应用，旧主题导出继续保留。
