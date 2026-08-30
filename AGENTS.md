# AGENTS.md — ClassNest 开发规则（AI Agent 最高层级）

> 给 AI Agent（Codex / opencode / 其他）使用的开发规则，基于当前仓库**实际代码**生成，并同步自 `docs/` 既定约定。
> 权威顺序：`docs/tech.md`（需求总规格）→ 本文件 → `docs/ARCHITECTURE.md`、`docs/CONVENTIONS.md`、`docs/API.md`、`docs/DATABASE.md`、`docs/DEVELOPMENT.md`、`docs/DECISIONS.md`。
> 冲突时：以 `docs/tech.md` 为准；本文件与派生规范冲突以本文件为准；仍无法消解时记录到 `docs/DECISIONS.md` 并向用户提问，不得擅自二选一。

## 1. 项目介绍

ClassNest 是 **WakeUp 风格课程表桌面应用**：本地优先、桌面端优先、无账号、无广告、支持多课表、复杂周数、课程冲突、导入导出、高度可定制。打开应用直接看到当前课表，不经首页/登录/欢迎页。

明确不做：闹钟、上课提醒、系统通知、后台提醒任务、倒计时、铃声、手机端 Widget、教务系统自动登录。

数据单向流动：`SQLite → Repository → Pinia Store → Engine → UI`，禁止反向依赖。

## 2. 技术栈（与 `package.json` / `Cargo.toml` 实际一致）

| 层 | 技术 | 说明 |
| --- | --- | --- |
| 前端 | Vue 3 + Vite + TypeScript（严格） | Composition API，`<script setup lang="ts">` |
| 状态 | Pinia | 计划 4 个 Store：`schedule` / `course` / `settings` / `ui` |
| 路由 | Vue Router | Hash 模式（D-2） |
| UI | Naive UI + SCSS | 管理型 UI 用 Naive UI；主课表为自定义领域 UI |
| 桌面 | Tauri 2 | `src-tauri/`，仅原生能力 |
| 数据库 | SQLite + `@tauri-apps/plugin-sql` | Repository 唯一访问口 |
| 工具链 | pnpm / Vitest / ESLint + Prettier | 见 `docs/DEVELOPMENT.md` §2 |

依赖管理：新增/更换/删除 npm 依赖或 Rust crate 必须**先说明用途与理由并征求用户**；锁文件（pnpm-lock.yaml / Cargo.lock）纳入版本管理、不手工改动。

## 3. 当前完成阶段（以实际代码为准，2026-08-30 审计）

- **Git**：仓库已初始化，remote `origin → github.com/LingBrian/ClassNest`，默认分支 `main`，根提交 `chore: initialize project repository`。
- **Phase 0（骨架）已完成**：`src/`、`src-tauri/`、migration 0001-0004、Naive UI Provider（`App.vue`）、Hash Router 全路由、工具链落地。
- **Phase 1（Schedule Core）已完成**：
  - `src/models/`：`schedule.ts` / `course.ts` / `session.ts`(含 WeekRule 序列化) / `timetable.ts`(含 DEFAULT_SECTION_TIMES)。
  - `src/repositories/`：`ScheduleRepository`（含新建课表三件套：schedule + 默认 timetable + 默认 schedule_style，同一事务）、`CourseRepository`、`CourseSessionRepository`。
  - `src/stores/`：`schedule.ts`、`course.ts`（加载一次进缓存，切周不重查）。
  - UI：`components/schedule/ScheduleCreateDialog.vue`、`components/course/`（CourseEditor/CourseSessionEditor/CourseSessionList）、`components/schedule-grid/`（ScheduleGrid/ScheduleHeader/WeekNavigator/TimeAxis/DayColumn/CourseCard）、`views/ScheduleView.vue`（含空状态）。
- **Phase 2（Engine）已完成（62 个测试全绿）**：`src/engine/` 下 `weekRuleEngine.ts` / `dateEngine.ts` / `conflictEngine.ts` / `positionEngine.ts` / `scheduleEngine.ts` 及其 `.test.ts`。
- **仍为占位**：`views/ScheduleManagerView.vue`（Phase 3）、`ScheduleSettingsView.vue` / `GlobalSettingsView.vue`（Phase 4）、`ImportView.vue`（Phase 5）、`ExportView.vue`（Phase 5-6）——均为 `<div>……（Phase N 填充）</div>` 空壳。
- **尚未落地**：settingsStore / uiStore、ScheduleStyleRepository、SettingsRepository、importers/、exporters/、services/、Rust command（`commands/mod.rs` 为占位）。

> 以上为当前真实状态。任何 Agent 不得把「占位/未实现」当作已存在事实，也不得偏离 Phase 顺序擅自开发。

## 4. Phase 开发规则（顺序 Phase 0 → 10）

每个 Phase 严格按序号推进，未过当前 Phase 验收不得进入下一阶段（见 `docs/DEVELOPMENT.md` §6、`docs/项目实施计划.md`）：

| Phase | 内容 | 状态 |
| --- | --- | --- |
| 0 | 项目骨架 | ✅ 已验收 |
| 1 | Schedule Core（课表/课程/时间段 CRUD、主课表、切周、空状态） | ✅ 已完成 |
| 2 | Schedule Engine（周/日期/冲突/位置/渲染引擎 + 单测） | ✅ 已完成 |
| 3 | 多课表（切换器、管理页、三件套、级联删除） | ⬜ 占位视图 |
| 4 | 外观（ScheduleStyle、外观表单、实时预览） | ⬜ 占位视图 |
| 5 | CSV 导入/导出（Importer 管线、预览、校验） | ⬜ 占位视图 |
| 6 | Backup/Restore/ICS | ⬜ 占位视图 |
| 7 | 调课 CourseOverride（复用 0002 表） | ⬜ 未开始 |
| 8 | HTML 导入（GenericHtmlImporter） | ⬜ 未开始 |
| 9 | 自动备份 | ⬜ 未开始 |
| 10 | 高级功能（拖拽导入、复制课表等，MVP 后） | ⬜ 未开始 |

每个 Phase 内部落地顺序（`docs/DEVELOPMENT.md` §5）：
```text
models → Repository(含 migration) → Engine → Store → Service → UI → 测试
```
例外：纯 UI 改动（类名/样式/组件拆分）不强制走全链，但不得写领域算法、不得直连 DB。

每个 Phase 完成必须输出（Completion Rule）：
```text
1. 修改文件清单  2. 新增功能  3. 数据库是否变化
4. 新增测试      5. 当前验收结果  6. 已知问题  7. 下一阶段建议
```

## 5. 目录职责

以 `docs/ARCHITECTURE.md` / `docs/tech.md` §6-7 为准；实际已落目录如下：

```text
src/
├── views/          # 页面（PascalCase + View.vue）
├── components/     # 组件：schedule/、schedule-grid/、course/、settings/、import/、common/
├── stores/         # Pinia：schedule.ts、course.ts（settings/ui 计划）
├── models/         # 领域模型（schedule/course/session/timetable/override/scheduleStyle）
├── engine/         # 纯领域逻辑，独立于 Vue
├── repositories/   # PascalCase + Repository
├── database/       # connection.ts、migrations/、runner.ts、repository-db.ts
├── importers/      # 计划：types/registry/csv/html/backup
├── exporters/      # 计划：csv/ics/backup
├── services/       # 计划：backup/file/settings
├── utils/          # 计划（内容未定，D-9）
├── router/         # index.ts
└── styles/         # main.scss

src-tauri/
└── src/commands/   # 仅 file.rs / backup.rs / system.rs 三块原生能力
```

新文件只能落到职责对应目录，禁止并行创建职责重复的同级目录。Tauri 侧只在 `src-tauri/` 下放原生能力。

## 6. Vue 规范

- 一律 Vue 3 Composition API + `<script setup lang="ts">`，禁止 Options API。
- props/emits 用 `defineProps<...>()` / `defineEmits<...>()` 显式类型。
- 组件只消费 Store / Engine 输出，**不持有数据副本**（禁止 CourseCard、ScheduleGrid、Store 各存一份课程）。
- **主课表 ScheduleGrid 禁止 `NDataTable` / `<table>`**，必须 CSS Grid + absolute positioning。基础布局：`grid-template-columns: 72px repeat(7, minmax(120px, 1fr));`。
- 领域算法（单双周、日期、冲突、位置）禁止出现在 Template / Component / CSS，一律进 `src/engine/`。
- 管理型 UI（设置、表单、弹窗、导入预览、错误提示）优先 Naive UI：`NButton`/`NForm`/`NModal`/`NDrawer`/`NDialog`/`NTabs`/`NAlert`/`NEmpty`/`NSpin`/`NDropdown`/`NColorPicker` 等。
- 课程详情用 `NDrawer`，不新增路由；新建课表用 Drawer/Modal；危险操作（删除）必须 `NDialog` 确认。
- 空状态必须存在：无课表时 `NEmpty` +「创建课表 / 导入课表」，禁止白屏。
- 路由集合固定（Hash）：`/`、`/schedules`、`/schedule/:id/settings`、`/course/new`、`/course/:id/edit`、`/import`、`/export`、`/settings`。
- 样式使用 SCSS，组件默认 `scoped`；日期格式 `YYYY-MM-DD`，时间 `HH:MM`（24h），星期 `1=周一…7=周日`，节次从 1 起，颜色 hex。

## 7. Pinia 规范

- 固定四个 Store：`schedule` / `course` / `settings` / `ui`，职责见 `docs/ARCHITECTURE.md` §3.3；**新增第 5 个 Store 属架构变更**，必须先登记 DECISIONS 并征求用户。
- 同一数据只允许一个事实来源：`SQLite → Repository → Pinia`；组件不得再复制一份。
- 切周**不重新查询 SQLite**：课程/时间段加载一次 → Pinia 缓存 → Engine 计算；仅在课程/课表/设置变更后刷新。
- 组件通过 action / computed 使用 store，禁止在组件里直接改写 state 属性。
- action 命名统一：`loadXxx` / `createXxx` / `updateXxx` / `deleteXxx` / `switchXxx` / `refresh`。
- 只有 UI 瞬态（drawer/modal/当前周/导入弹窗/导出弹窗开关）进 `uiStore`，业务数据不得放进 uiStore。
- Store 不得绕过 Repository 直接执行 SQL。

## 8. Tauri 规范

- Rust 侧仅 `commands/{file.rs, backup.rs, system.rs}` 三块能力；**不为普通 DB CRUD 写 command**。
- 普通 DB CRUD 一律由前端 Repository + `@tauri-apps/plugin-sql` 完成。
- command 返回明确 成功/失败 结构，错误转前端可展示信息，**不得 panic 让页面白屏**。
- 修改 `capabilities/`、`tauri.conf.json`、`Cargo.toml` 必须先征求用户。
- 权限最小化：`capabilities/`（当前 `default.json`）只按功能最小授权。

## 9. SQLite 规范

- 数据库文件 `classnest.db`，落 Tauri app 数据目录（D-10）；`.gitignore` 已排除 `*.db` 及 journal/wal/shm。
- 所有数据库变化必须通过**新增 migration**（自 `0005_xxx.sql` 起）；源规格见 `src/database/migrations.ts`（顺序执行，`PRAGMA user_version` 记账，D-8）。
- **禁止修改/回滚旧 migration**。
- 连接后 `PRAGMA foreign_keys = ON;`（由 0001 顶部负责）。
- 删除关系使用 `FOREIGN KEY ... ON DELETE CASCADE`（schedule/course/course_session/timetable/schedule_style 等）。
- 表/字段 snake_case；`week_rule` 为 JSON 字符串（`serializeWeekRule`/`deserializeWeekRule`）；`app_setting` 只存全局设置，SQLite key 一律 snake_case。
- 新建课表必须同一流程创建 `schedule + 默认 timetable + 默认 schedule_style`。

## 10. Repository 规范

- **Repository 是唯一数据库访问口**；View/Component 禁止直接 `db.select(...)` / `db.execute(...)`。
- 每个 Repository 提供成组方法：`findByXxx` / `findById` / `create` / `update` / `delete`，返回 TS 模型，不向调用方暴露 SQL。
- **DB 注入**：构造函数默认 `private readonly db: RepositoryDb = getRepositoryDb()`；单测注入 better-sqlite3 内存适配器（test-only，见 `sqlite-test-adapter.ts`）。
- Repository 不承载业务规则、不承载 UI 状态；week_rule 序列化只在 Repository 层处理。
- 接口契约与签名以 `docs/API.md` 为准；**变更 Repository/Engine/Store/Importer/Tauri command 签名必须先同步 `docs/API.md`**。

## 11. 测试规范

- 框架：Vitest。命令：单次 `pnpm test`、监听 `pnpm test:watch`。
- 必测范围：`WeekRuleEngine` / `DateEngine` / `ConflictEngine` / `PositionEngine` / `ScheduleEngine` / CSV Importer / Backup Importer。
- 重点用例：连续周、单双周、自定义周、跨月、跨年、多时间段、冲突、调课、删除级联、自定义时间。
- 命名：`<被测文件>.test.ts` 与被测文件同目录（已一致）。
- Repository 测试用 test-only `better-sqlite3`（内存适配器），生产代码不引入 DB 额外依赖。
- 每次修改后运行相关单测 + `pnpm run lint` + `pnpm run format:check` + `pnpm build`；均须通过。
- 验证通过定义（`docs/DEVELOPMENT.md` §2）：`pnpm build` 0 错误、`pnpm test` 全绿、`lint` 与 `format:check` 0 报错。
- **需人工验收**（Agent 不得自证通过）：Tauri 窗口/视觉/交互、重启后数据仍在、深色/浅色 UI。Agent 交付时附「已自动验证 / 待用户验收」清单。

## 12. Git 规范

- 仓库已初始化，默认分支 `main`，remote：`origin → git@github.com:LingBrian/ClassNest.git`。
- 小步提交、语义化 commit message（如 `feat:` / `fix:` / `chore:` / `refactor:` / `docs:` / `test:`）。
- 提交前 `git status` / `git diff`，只暂存本次相关文件；不提交密钥。
- `.gitignore` 已排除：node_modules、dist、coverage、src-tauri/target、src-tauri/gen、*.db、IDE 配置、临时/日志文件。
- 不提交运行时产物（node_modules、dist、target 等）；锁文件保留跟踪。
- 不擅自 `git init` / `git push` / 改 remote / 使用破坏性命令，除非用户明确要求。

## 13. Issue 开发流程（GitHub Issue 驱动）

本仓库以 GitHub Issue 驱动开发。**每个功能/修复都从一个已存在或新开的 Issue 开始**：

1. **关联 Issue**：开发前确认存在对应 Issue；没有则先创建，写清目标与验收标准。
2. **建分支**：从 `main` 切出，命名 `fix/`、`feat/` 或 `refactor/` 前缀（如 `feat/schedule-style`）。
3. **读现状**：读相关代码与 `docs/`（tech.md / 对应规范 / DECISIONS 未定项），`git status` 确认无未提交改动。
4. **改代码**：遵循本文件各章节规范，最小 patch，只改本 Issue 相关文件。
5. **测试**：补/改单测并运行 `pnpm test`；`pnpm run lint` / `format:check` / `pnpm build` 全绿。
6. **Commit**：语义化提交，message 可引用 Issue（如 `fix: … (closes #12)`）。
7. **PR**：提交 PR 到 `main`，PR 描述包含 Issue 引用、改动摘要、验收结果（自动验证/待人工验收）清单。

> 每次开发流程固定为：**Issue → 分支 → 修改 → 测试 → Commit → PR**，不得跳过。

## 14. PR 规范

- PR 基分支为 `main`；PR 标题与描述与对应 Phase / Issue 对齐。
- 描述至少包含：关联 Issue、修改文件清单、新增功能、数据库是否变化、新增测试、验收结果（已自动验证 / 待用户验收）、已知问题。
- 遵守 Definition of Done（见 `docs/DEVELOPMENT.md` §7）：代码 + UI + 持久化 + 错误处理 + 测试 + 重启验证。
- 合并前 `pnpm build`、`pnpm test`、`pnpm run lint`、`pnpm run format:check` 必须全绿。
- 不在未获用户确认前发起推送/合并；PR 由用户 review 决定合并。

## 15. 禁止事项

- 禁止实现闹钟/提醒/通知/倒计时/铃声等被明确排除的功能。
- 禁止更换技术栈（React/Electron/Element Plus/Ant Design Vue 等）。
- 禁止修改旧 migration、禁止绕过 Repository 直接 `db.select/execute`。
- 禁止在 Template/Component/CSS 里实现单双周、日期、冲突、位置算法。
- 禁止用 `NDataTable`/`<table>` 实现主课表。
- 禁止为修复小问题重写整个模块/项目；优先 small patch。
- 禁止声称不存在的代码/库/表/命令/测试已存在。
- 禁止未授权修改 `docs/tech.md`、旧 migration、capabilities 与核心配置。
- 禁止跨阶段开发（未过当前 Phase 验收不得进入下一阶段）。
- 禁止未经同意引入新依赖或新增 Store。

---

## AI 禁令（强制）

AI 不得：

- **未查看相关代码/文档就直接修改**（先 `rg`/读文件确认现状）；
- **修改架构**（目录、分层、路由集合、数据模型变更必须进 DECISIONS 并征求用户）；
- **引入新依赖**（npm 或 crate，须先说明并征求用户）；
- **删除已有模块**（复用现有实现，不重复造轮子、不清理既有能力）；
- **跨 Phase 开发**（当前 Phase 未验收不进入下一阶段）；
- **修改无关文件**（只改本 Issue/任务相关文件，不顺手重构）；
- **自动重构**（未经要求不做大规模重构；发现问题只记录到 `docs/DECISIONS.md`）。

## 每次开发必须执行

```text
Issue → 分支 → 修改 → 测试 → Commit → PR
```
不得跳过其中任何一步。

## Definition of Done

一个功能只有同时满足六项才算完成：

```text
代码完成 + UI 完成 + 数据持久化完成 + 错误处理完成 + 测试完成 + 重启验证完成
```
MVP 21 项清单见 `docs/项目实施计划.md` §15；「测试完成」以自动单测为准，「重启验证/UI/视觉」由用户验收。
