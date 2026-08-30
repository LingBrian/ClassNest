# CONVENTIONS.md — ClassNest 编码规范

> 权威来源：`docs/tech.md` 与 `docs/ARCHITECTURE.md`；冲突时以 `docs/AGENTS.md` 与 `docs/tech.md` 为准。
> 当前仓库尚无代码（审计基线见 AGENTS.md §1），本文档记录的是「落地时必须遵守的约定」。

## 1. 通用统一项

- 一门语言统一：Vue 3 Composition API + `<script setup lang="ts">`，禁止 Options API。
- TypeScript 严格程度待定（见 `docs/DECISIONS.md` D-6）；定案前领域模型/Repository/Engine 层必须无 `any`，其余层也不得用 `any` 糊掉领域边界。
- 日期格式统一 `YYYY-MM-DD`；时间格式统一 `HH:MM`（24 小时制）。
- 星期编号统一：`1 = 周一 … 7 = 周日`（与 course_session.weekday、schedule.first_day_of_week 一致）。
- 节次编号从 1 起（start_section / end_section）。
- 颜色统一 hex 字符串（如 `#4C8DFF`）。

## 2. 命名规则

| 类型 | 规则 | 依据（tech.md 目录树） |
| --- | --- | --- |
| View 文件 | PascalCase + `View.vue`（`ScheduleView.vue`） | §6 |
| Component 文件 | PascalCase（`ScheduleGrid.vue`、`CourseCard.vue`） | §6 |
| Engine 文件 | camelCase + Engine （`weekRuleEngine.ts`、`dateEngine.ts`） | §6/§20 |
| Repository 文件 | PascalCase + `Repository`（`CourseRepository.ts`） | §6/§19 |
| Store 文件 | camelCase（`schedule.ts`、`course.ts`、`settings.ts`、`ui.ts`） | §6/§52 |
| Model 文件 | camelCase（`schedule.ts`、`session.ts`、`override.ts`） | §6 |
| Importer/Exporter 文件 | camelCase（`csvExporter.ts`、`icsExporter.ts`；类 `CsvImporter.ts`） | §6 |
| Service 文件 | camelCase + Service（`backupService.ts`、`fileService.ts`） | §6 |
| Router | 固定 `router/index.ts` | §6/§51 |
| 接口/类型 | PascalCase interface（`RenderedCourse`、`CourseImporter`） | §23/§41 |
| 数据库表/字段 | snake_case | §15 |

- 同名职责冲突（`components/schedule/` 出现两次）是待决策项，见 `docs/DECISIONS.md`。

## 3. Vue SFC 规范

- 一律 `<script setup lang="ts">`，props/emits 用 `defineProps<...>()` / `defineEmits<...>()` 显式类型。
- 组件只消费 Store / Engine 输出，不得持有数据副本（禁止 CourseCard、ScheduleGrid、Store 各存一份课程）。
- 主课表（ScheduleGrid）禁止 `NDataTable` / `<table>`，必须 CSS Grid + absolute positioning。
- 领域算法（单双周、日期、冲突、位置）禁止出现在 Template / Component / CSS 中，一律进 `src/engine/`。

## 4. Naive UI 使用规范

- 管理型 UI（设置、表单、弹窗、导入预览、错误提示、下拉、输入、选择、日期、调色、开关、滑块、Tabs、Alert、Notification、Empty、Loading）优先使用 Naive UI。
- 危险操作确认一律 `NDialog`（删除课表必须提示级联影响）。
- 课程详情用 `NDrawer`，不新增路由；新建课表用 `NDrawer` / `NModal`。
- 设置页用 `NTabs`（基本设置 / 时间表 / 外观 / 高级），Tab 切换不改变 URL。
- 表单一律 `NForm` + `NFormItem`。
- 空状态必须存在：无课表时 `NEmpty` +「创建课表 / 导入课表」，禁止白屏。

## 5. 状态管理规范（Pinia）

- 固定四个 Store：`schedule` / `course` / `settings` / `ui`，职责见 `docs/ARCHITECTURE.md` §3.3。
- 同一数据只允许一个事实来源：SQLite → Repository → Pinia；禁止组件内再复制。
- 切周不重新查询 SQLite：课程加载一次 → Pinia 缓存 → Engine 计算；仅在课程/课表/设置变更后刷新。
- 路由参数只用于定位（`:id`），业务数据一律从 Store 读取。
- Store 不得绕过 Repository 直接执行 SQL。
- 新增第 5 个 Store 属于架构变更：必须先登记 `docs/DECISIONS.md` 并向用户确认，不得随手新建。
- Store action 命名统一：`loadXxx` / `createXxx` / `updateXxx` / `deleteXxx` / `switchXxx` / `refresh`（例外如 `clearXxx` 需说明）。
- 只有 UI 瞬态（drawer / modal / 当前周 / 导入弹窗 / 导出弹窗等开关状态）进入 `uiStore`；业务数据不得放进 `uiStore`。
- 组件只能通过 action / computed 使用 store，禁止在组件里直接改写 store 的 state 属性。

## 6. Repository 规范

- Repository 是唯一数据库访问口，View/Component 禁止直接 `db.select(...)` / `db.execute(...)`。
- 每个 Repository 提供成组方法：`findByXxx` / `findById` / `create` / `update` / `delete`，返回 TypeScript 模型，不向调用方暴露 SQL。
- Repository 不承载业务规则、不承载 UI 状态。

## 7. Engine 规范

- `src/engine/` 是纯领域逻辑，独立于 Vue，不得依赖 Store、也不被 Store 反向依赖。
- 输出统一模型 `RenderedCourse`（`docs/ARCHITECTURE.md` §3.5），UI 只消费该结果。
- 冲突不删除后者，必须保留两个课程并做冲突布局。

## 8. 数据模型规范

- 领域模型集中在 `src/models/`，共享类型不得散落在组件中。
- Course 不保存星期/节次/老师/地点，这些属于 CourseSession；一门课程允许多个 Session。
- WeekRule 必须是结构化对象并以 JSON 存储；禁止 UI 直接操作 `"1-5、7-11单"` 字符串作为核心数据。
- 周数输入必须提供「第 1-16 周 / 单双周 / 自定义周数」，并在 UI 预览成具体周列表。
- 外观（ScheduleStyle）与时间表（TimeTable）属于课表，不属于全局设置。
- 全局设置只保存真正的全局项，存储层键名一律 snake_case：`theme` / `language` / `active_schedule_id` / `auto_backup` / `startup_behavior`（前端变量可用 camelCase 映射，但 SQLite key 一律 snake_case）。

## 9. 错误处理规范

- 数据库错误 → `NNotification`；导入错误 → `NAlert` + `ImportErrorList`；不可恢复错误 → Error Boundary。
- 所有 async 入口必须有错误处理，禁止 `Uncaught Promise` 导致页面崩溃。
- 不允许 `console.log` 在 UI 组件中散落；日志规则见下。
- Store action 中的 Repository/异步调用必须 try/catch，失败转 `NMessage` / `NNotification`，不得让 Promise 泄漏到页面。表单校验错误就地用 `NFormItem` 校验提示，不弹全局提示。

## 10. 日志规范

- 开发阶段：`console.debug` / `console.warn` / `console.error`。
- 正式版：统一 `logger.debug` / `logger.info` / `logger.warn` / `logger.error`（实现方式为 NEEDS_DECISION，见 DECISIONS.md）。
- 禁止到处散落复杂日志。

## 11. 保存策略（统一）

- 普通设置字段：显式「保存」按钮。
- 外观设置：实时保存。
- 整个项目只允许这一种策略组合，不得页页不同。

## 12. 导入导出规范

- 所有 Importer 实现统一 `CourseImporter` 接口，输出统一模型，走 `Parse → Validate → Preview → Confirm → Commit` 管线。
- 禁止解析后直接写数据库；错误不直接写入 DB。
- 备份为完整 JSON，必须包含 `version` / `exportedAt` 与各表数据；恢复前验证版本/结构/引用，事务写入，失败回滚。

## 13. 样式规范

- 使用 SCSS；组件样式默认 `scoped`。若需全局主题/变量 SCSS，须在脚手架阶段登记到 `docs/DECISIONS.md` 后引入，不得提前创建全局样式文件。
- 主课表 CSS Grid 布局基础：`grid-template-columns: 72px repeat(7, minmax(120px, 1fr));`。
- 风格遵循 `docs/页面路由设计.md` 中「管理页 Naive UI、主课表自定义领域 UI」的区分。
- 深色/浅色 UI 通过 Naive UI theme 切换，theme 是全局设置项。

## 14. 落地前必须先决策的约定（不猜测）

- `src/utils/` 具体内容未定义（TODO，DECISIONS D-9）。
- 工具链已定（2026-08-29，DECISIONS D-3/4/5）：pnpm / Vitest(+test-only better-sqlite3) / ESLint+Prettier；命令表见 DEVELOPMENT.md §2。
- Router 模式 tech.md 未定死：Phase 0 按推荐 Hash 落地（D-2，仍 OPEN，需用户确认）。
- 其余未定项：TS 严格度 D-6、Logger D-7、migration 记账 D-8、DB 文件名 D-10、components/schedule 目录拆分 D-1。

## 15. 依赖管理规范

- 新增/更换/删除任何 npm 依赖或 Rust crate 前，必须先检查 `package.json` / `Cargo.toml`、说明用途与理由并征求用户同意后才动手；拒绝“顺手安装”。
- 只允许既定技术栈：Vue 3 / Vite / TypeScript / Pinia / Vue Router / Naive UI / SCSS / Tauri 2 / `@tauri-apps/plugin-sql` / SQLite；禁止引入 React、Electron、Element Plus、Ant Design Vue 及其他 UI 框架。
- `@tauri-apps/plugin-sql` 是唯一数据库访问库；不得引入替代 DB 访问库或自建“更优雅”的 DB 封装。
- 锁文件（package-lock / pnpm-lock / yarn-lock / Cargo.lock）应纳入版本管理并保持与清单一致；不手工改动锁文件内容。
- 不自行升级主版本依赖；升级前说明原因并征求用户。
- Rust 侧新增 crate 参照前两条；不得为普通 DB CRUD 引入多余 crate（普通 CRUD 由 Repository 完成）。