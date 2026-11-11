# dict2 接口迁移记录

迁移日期：2026-10-30。范围：web2 前端，包含现有未提交的质控文档排序功能。协议依据为用户提供的 talk/sys/sys.proto，协议文件未修改。

## 迁移结果

- 原排查发现的 33 处旧请求封装已全部处理：有效调用迁移或合并到已有 dict2 封装，两处无调用封装删除。
- 原标识值保持不变，由请求的 `dict_name` 改传 `dict_code`，不增加旧接口回退。
- 字典项读取统一使用 `sys/RetrieveDict2ItemList`、`RetrieveDict2ItemListReq/Res` 和 `Dict2ItemRow`，同步更新调用方与相关 .d.ts。
- 保留机构参数、搜索词、数量限制、默认参数、取消信号、选项值、显示名称、排序和懒加载/缓存行为；显式列清单只保留新字典项支持的字段。

| 模块 | 已迁移能力 |
|---|---|
| Host / data | AI 模型、智能体、指标 AI 分析 |
| 系统管理 | 机构、用户、科室字典；原字典管理保持 dict2 |
| 药品 | 管理、查询、用法、库存、药房、退药、厂家等 |
| 医生站 | 门诊信息、住院医嘱、预出院、手术申请等 |
| 护士站 | 诊间、床位、执行部位、护理、出院及转科/转床/转区 |
| ICU | 入科、预出科、设备类型 |
| 手术 / 麻醉 / 治疗 | 手术和麻醉字典、本地保留缓存、共享联单频次 |
| 收费 | 费用类型和共享患者资料 |
| 病案 / 质控 | 编码类型、病案等级、在院/归档/抽检文档排序 |
| 教学 | 学生、课程、考试及授权；语种编码体系 |
| 指标 | 指标方向和共享预览 |
| visit / widget | 患者资料、过敏史、护理、联单、模板保存、床位卡片 |

## 字典头与代码体系

新字典项没有 `item_code_system`。药品国籍、教学语种先调用 `sys/GetDict2Property`，按原编码取得 `dict_id` 和 `dict_code_system`，再按同一 dict_id 获取字典项。字典头缺失或字典项读取失败时停止加载，不以缺失标识继续查询。

- [国籍字典加载](/Users/youzhonghai/工作/项目/web2/remote/drug/src/modules/DrugManagement/components/countryDictionary.ts:4)：默认选择、切换和清空时，将字典头的代码体系保存到 country_code_system。
- [语种字典加载](/Users/youzhonghai/工作/项目/web2/remote/teach/src/pages/StudentManagement/languageDictionary.ts:3)：学生语种选择将代码体系保存到 lang_code_system。

## 共享能力与清理

- 保留公开属性 dictName、allergyTypeDictName 的名称，属性值作为字典编码发送。
- 患者资料保留已有选项值、已保存名称回显及展开加载；护理字典保留并发去重和缓存。
- 联单频次继续使用编码 anes_bill_freq；AI 分析通过 service.dictionary 查询 ai.model，保留取消信号。
- 护士站执行部位下拉按协议读取 row_list，显示和值均使用 item_name，修正原有 dept_list / dept_name 误读。
- 删除护士站体温单未调用的 getDictAPI → sys/GetDictItem2，以及 widget 床位卡片未调用的设备类型旧封装。
- 治疗、麻醉、手术三套保留的字典缓存一并迁移；合并系统管理、共享就诊和医生站中的重复通用封装。
- 更新指标浏览器 mock 和 AI 分析测试；清理废弃字典类型及旧请求示例。
- 历史对照测试中的 retrieveDictDataAPI 是供外部旧参考页面导入的无网络 stub，保留以维持对照测试；生产代码不再包含旧字典请求。
- 服务协议中的旧 RPC 声明未修改，声明不等于前端调用。

## 验证

- 迁移前及迁移后，17 个受影响包的 TypeScript 检查均通过。
- 17 个受影响包的生产构建均通过。
- npm run dict:test：48 项通过，覆盖旧请求扫描、30 个封装的参数转发、麻醉方式请求、代码体系、失败与空结果、患者选项、护理缓存、联单频次、质控排序及 7 个护士站执行表单。
- npm --prefix share/data test：62 项通过，包含 AI 模型加载与取消信号测试。
- npm --prefix remote/metric test：28 项通过。

## 联调前提

本次未改动后端或迁移数据库，也未使用生产凭据发起联调请求。部署前需确认 dict2 中存在对应编码和字典项；缺失数据保持现有空结果或错误处理，不回退旧接口。当前没有实际环境的缺失字典清单。
