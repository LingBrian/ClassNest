# DECISIONS.md — ClassNest 待定事项与决策记录

> 用途：记录所有**未定/冲突/待人工确认**事项。Agent 遇到规范无法消解的问题时一律登记到这里并向用户提问，不得擅自二选一。
> 状态：`[OPEN]` 待决策 / `[DECIDED]` 已决策（含结论与日期）/ `[NOTE]` 仅说明，无需决策。

## 0. 使用规则

- 新增未定事项必须登记：状态、主题、背景、涉及文档、影响。
- 决策后：改状态为 `[DECIDED]`，写明结论，并把结论落到对应规范文档。
- 有结论前，Agent 不得把未定事项当作“既定事实”写进代码或文档。

---

## [DECIDED] D-1：`components/` 目录拆分（schedule-grid + schedule）——2026-08-29

- 背景：`docs/tech.md` §6 把「主课表 Grid 组件」与「课表切换/管理组件」都放进 `components/schedule/`。
- 决策（用户确认，按推荐方案 1）：
  - 主课表 Grid 组件 → `components/schedule-grid/`：ScheduleGrid / ScheduleHeader / WeekNavigator / TimeAxis / DayColumn / CurrentDayIndicator / CourseCard / ConflictCourseCard / GridBackground；
  - 课表切换/管理/新建 → `components/schedule/`：ScheduleSwitcher / ScheduleManager / ScheduleCreateDialog；
  - `components/course/`、`components/settings/`、`components/import/`、`components/common/` 不变。
- 影响：Phase 3+ 的 UI 组件落地按此命名；已在 `docs/ARCHITECTURE.md` 目录树登记。

## [DECIDED] D-2：Router 使用 Hash 模式——2026-08-29

- 背景：`docs/tech.md` §51 只固定路由集合，未定模式；`docs/页面路由设计.md` §4 推荐 Hash（Tauri WebView 打包后避免刷新 404）。
- 决策：采用 **Hash**（`createWebHashHistory`），已落地于 `src/router/index.ts`，与路由集合定义一致；如打包期出现路由问题再评估切换。

## [DECIDED] D-3：包管理器选型（pnpm）——2026-08-29

- 结论：**pnpm**（用户确认）。原因：Vite 官方推荐、create-tauri-app 支持、安装快/省磁盘；经 `package.json` scripts 调用 tauri CLI 无兼容问题。
- 回退方案：若出现 pnpm 兼容问题，回退 npm 并在此登记。

## [DECIDED] D-4：测试框架与运行器（Vitest）——2026-08-29

- 结论：**Vitest**（用户确认）。原因：与 Vite 同配置同生态、原生 TS、API 兼容 Jest。
- 配套（用户确认）：Repository 单测在 Node 环境无法直接用 `@tauri-apps/plugin-sql`，引入 **test-only 开发依赖 `better-sqlite3`** 做内存 SQLite 适配；生产代码不引入任何 DB 库以外的依赖。
- 测试命令：`pnpm test`（vitest run） / `pnpm test:watch`。
- 落地进展（2026-08-29）：已装 `vitest`/`better-sqlite3`/`@types/better-sqlite3`（两者均 test-only）；`pnpm test` 通过（migration 幂等 3 用例）；Repository 单测按「可注入 MigrationDb 接口」模式落地（见 `src/database/runner.ts`）。

## [DECIDED] D-5：Lint / Format 工具链（ESLint + Prettier）——2026-08-29

- 结论：**ESLint（flat config：eslint-plugin-vue + @vue/eslint-config-typescript）+ Prettier**（用户确认）。原因：Vue 官方脚手架默认栈，对 `<script setup lang="ts">` 支持成熟。
- 命令：`pnpm run lint` / `pnpm run lint:fix` / `pnpm run format` / `pnpm run format:check`。
- 备注：`console.debug/warn/error` 放行规则见 CONVENTIONS.md §10；正式版 logger 仍为 OPEN（D-7）。

## [DECIDED] D-6：TypeScript 严格程度（strict）——2026-08-29

- 背景：AGENTS.md §4 要求禁止 `any` 糊领域边界。
- 决策：**`strict: true`**（tsconfig.app 采用 `@vue/tsconfig/tsconfig.dom.json`，默认 strict），`vue-tsc -b && vite build` 为构建前置，已落地；领域模型/Repository/Engine 层禁止 `any`。

## [OPEN] D-7：正式版 Logger 实现

- 背景：tech.md §57 要求正式版统一 `logger.debug/info/warn/error`，实现方式未定。
- 候选：a) 自研轻量 Logger（console 封装 + 开关）；b) 引入日志库。
- 建议：先 a（体积小、本地应用无远端日志需求），属于「新增依赖必须征求用户」的范畴。

## [DECIDED] D-8：Migration 执行与版本记账（PRAGMA user_version）——2026-08-29

- 背景：`src/database/database.ts` 需在连接后执行未应用的 migration。
- 决策：按推荐方案 a——按文件名顺序执行 + `PRAGMA user_version` 记账；已落地于 `src/database/runner.ts`（幂等、增量）+ `runner.test.ts`。不引入 `migration_log` 表。

## [OPEN] D-9：`src/utils/` 内容未定义

- 背景：tech.md §6 列出 `utils/` 但未定义内容。
- 影响：Agent 不得自行往 `utils/` 塞职责不明的通用函数。
- 建议：先不建目录；确有跨模块复用函数时再新增并登记到 ARCHITECTURE.md。

## [DECIDED] D-10：SQLite 数据库文件名（classnest.db，默认 app 数据目录）——2026-08-29

- 背景：`docs/struct.md` 示例用 `sqlite:wakeup.db`（该文档已被 tech.md 取代）；tech.md 未定文件名与位置。
- 决策：`sqlite:classnest.db`，落 Tauri app 数据目录（plugin-sql 默认路径），不硬编码工作目录；已落地于 `src/database/connection.ts`。

## [OPEN] D-11：Phase 7 与 0002_course_override 的表述矛盾

- 背景：`docs/项目实施计划.md` §10 写「0005_course_override 如已内置则复用现有表」；但 `course_override` 表已在 0002 内置（见 数据库设计.sql）。
- 影响：Phase 7 不应新增表。
- 建议：Phase 7 直接复用 0002 的表；如需扩展字段走 `0005_xxx.sql`。请人工确认后修正项目实施计划措辞。

## [OPEN] D-12：ARCHITECTURE.md 与 项目架构设计.md 内容重叠

- 背景：`docs/ARCHITECTURE.md` 与 `docs/项目架构设计.md` 高度同源（后者含架构图示与职责边界表）。
- 影响：双文档并存易漂移。
- 建议：以 `docs/ARCHITECTURE.md` 为唯一规范入口，`项目架构设计.md` 保留为设计说明文档；后续如无必要不再并行新增同职责文档（符合 AGENTS.md §3「不允许并行创建职责重复的同级目录」）。

## [OPEN] D-13：新规范文档命名

- 背景：现有文档文件名中英混用（`ARCHITECTURE.md` / `项目架构设计.md`、`数据库设计.sql`、`页面路由设计.md`）。
- 影响：新增文档（尤其英文名）与旧中文名混存于 docs/。
- 建议：新增规范一律英文小写+md（如 `conventions.md`），历史中文文件保持现状不强制改名；如需统一由人工确认。

## [OPEN] D-14：`app_setting` 键名称写法（camelCase vs snake_case）

- 背景：`AGENTS.md` §7 写 `activeScheduleId`（camelCase）；`docs/tech.md` §18 与 `docs/数据库设计.sql` 写 `active_schedule_id`（snake_case）。两者指同一个全局设置键。
- 影响：SettingsRepository 读写键名不一致会导致设置失效。
- 现状（2026-08-29 AI 可执行性审查）：已按数据库层为准把 Agent 侧规范统一为 snake_case 存储约定——`AGENTS.md` §7、`CONVENTIONS.md` §8、`API.md` §2.8、`DATABASE.md` §3 现已一致（前端变量可用 camelCase 映射，SQLite key 一律 snake_case）。
- 剩余事项：`docs/tech.md` §50 的示例说明仍写 camelCase；tech.md 属用户授权修改范围，是否回头修订由人工确认。

---

## [OPEN] D-15：不可自动验证的验收项由谁判定

- 背景：Definition of Done 含「重启验证」「UI 完成」「Tauri 窗口与视觉」等 Agent 无法自动执行的项目。
- 影响：若 Agent 自行宣布这些项通过，会虚构验收结果。
- 现状（2026-08-29 AI 可执行性审查）：已在 AGENTS.md §10、DEVELOPMENT.md §4 明确分工——Agent 执行自动可验证项并如实报告，人工项由用户验收。
- 建议：认可该分工；未获用户确认前，Agent 不得因「无法运行命令/无法重启」而宣称验收通过。

## [NOTE] N-1：tech.md 章节编号连续（1-64）

- tech.md 顶层章节连续编号 1-64；§59「Vibe Coding 阶段」内部再以 Phase 0-10 分子节；§16-§18 为 migration 定义。
- 结论：引用规范一律写「tech.md §NN」并核对标题；不得假设编号之外存在内容，段落标题与内容为准。

## [NOTE] N-2：项目当前基线（2026-08-29，Phase 0 已落地）

- 仓库已具备 Phase 0 脚手架：Vite+Vue3+TS 前端骨架、`src-tauri/`（Tauri 2）骨架、`@tauri-apps/plugin-sql` 接入、migration 0001-0004 与幂等测试、pnpm/Vitest/ESLint/Prettier 工具链；**尚无业务代码（Store/Engine/Repository/Importer/UI）、无 Git**。
- 结论：任何「业务组件/接口/表已实现」表述仍需落地代码证实，不得当作既成事实。

## [NOTE] N-4：Phase 1 UI 骨架的暂缓事项（2026-08-29）

- 已落地：ScheduleCreateDialog（新建课表三件套）、课程编辑（CourseEditor/CourseSessionEditor/CourseSessionList）、主课表骨架（ScheduleHeader/WeekNavigator/ScheduleGrid/DayColumn/TimeAxis/CourseCard）与空状态；已接入 scheduleStore/courseStore；`pnpm build/test/lint/format:check` 全绿。
- 暂缓（属 Phase 2 Engine 范畴；AGENTS §13 禁止领域算法进组件）：
  1. 周数完整编辑器（单双周/自定义 + 周预览）→ WeekRuleEngine；
  2. 「今天」跳转当前周 → DateEngine.getCurrentWeek；
  3. 主课表按周过滤、跨节次定位与冲突布局 → ScheduleEngine/PositionEngine/ConflictEngine。
- 当前骨架行为：时间段按星期分组堆叠展示，CourseCard 显示课程名/时间/地点/老师；「今天」按钮显示 Phase 2 提示。

## [NOTE] N-3：struct.md 已被 tech.md 取代

- `docs/struct.md` 中 `Element Plus / Naive UI` 并列、`src/api` 等结构是早期草案。
- 结论：仅作历史参考，决策依据一律以 tech.md 为准。