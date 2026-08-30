# AGENTS.md — ClassNest 项目开发规则（Codex / AI Agent 最高层级）

> 本文件是 Codex 在 ClassNest 仓库中工作的最高层级规则。详细信息按主题拆分到 `docs/`，本文件只保留必须遵守的结论。
> 权威顺序：`docs/tech.md`（需求与开发总规格）→ 本文件 → `docs/ARCHITECTURE.md`、`docs/CONVENTIONS.md`、`docs/API.md`、`docs/DATABASE.md`、`docs/DEVELOPMENT.md`、`docs/DECISIONS.md`。
> 规范之间发生冲突时：以 `docs/tech.md` 为准；本文件与衍生规范冲突时以本文件为准；仍然无法消解时记录到 `docs/DECISIONS.md` 并向用户提问，不得擅自二选一。

## 1. Project Overview

- ClassNest 是 **WakeUp 风格课程表桌面应用**：本地优先、桌面端优先、无账号、无广告、支持多课表、复杂周数、课程冲突、导入导出、高度可定制。
- 技术栈（来自 `docs/tech.md`，唯一权威）：Vue 3 + Vite + TypeScript + Pinia + Vue Router + Naive UI + SCSS + Tauri 2 + `@tauri-apps/plugin-sql` + SQLite。
- 明确不实现：闹钟、上课提醒、系统通知、后台提醒任务、倒计时、铃声、手机端 Widget、教务系统自动登录。
- 核心体验：打开应用直接看到当前课表，不经过首页/登录/欢迎页。
- **当前阶段（2026-08-29，Phase 0 已落地）**：`package.json`、`Cargo.toml`、`src/`、`src-tauri/`、构建与 Lint 配置**均已存在**（工具链已定：pnpm / Vitest / ESLint+Prettier，命令见 `docs/DEVELOPMENT.md` §2）。业务代码（Store/Engine/Repository/Importer/UI 功能）**尚未实现**，仍无 Git 仓库；任何 Agent 不得把“未实现的业务代码”当作已存在事实。
- 规范文档集：`docs/tech.md`（需求与开发总规格）、`docs/struct.md`（历史草案，已被 tech.md 取代，仅参考）、`docs/ARCHITECTURE.md`、`docs/CONVENTIONS.md`、`docs/API.md`、`docs/DATABASE.md`、`docs/DEVELOPMENT.md`、`docs/DECISIONS.md`，以及设计文档 `docs/项目架构设计.md`、`docs/页面路由设计.md`、`docs/数据库设计.sql`、`docs/项目实施计划.md`。它们全部是 docs 中的规划文档，**不代表任何代码已存在**。

## 2. Architecture Rules

- 数据单向流动：`SQLite → Repository → Pinia Store → Engine → UI`；禁止反向依赖。
- Repository 是唯一数据库访问口；View/Component 禁止直接 `db.select(...)`。
- Engine（`src/engine/`）是纯领域逻辑，必须独立于 Vue；单双周、日期、冲突、位置计算禁止出现在 Template、Component 或 CSS 中。
- 主课表 Schedule Grid 禁止 `NDataTable` / `<table>`，必须使用 CSS Grid + absolute positioning + Vue 组件。
- Tauri/Rust 只承担原生能力（文件系统、系统信息、备份、原生窗口、托盘），不为普通数据库 CRUD 写 Rust command。
- 不做无需求的通用抽象层；不为“看起来规范”引入新目录/新框架。

## 3. Directory Rules

- 目录结构以 `docs/ARCHITECTURE.md` 中记录的最终目录为准（源自 `docs/tech.md` 第 6、7 节）。
- 新文件只能落到其职责对应的目录：views/components/stores/models/engine/repositories/database/importers/exporters/services/utils/router；Tauri 侧只放 `src-tauri/` 下的原生能力目录。
- 不允许并行创建职责重复的同级目录。
- 可正常修改：`src/` 与 `src-tauri/` 计划树内文件、新增 migration（`0005_xxx.sql` 起）、新增测试、规范性文档。注意：这些目录当前并不存在，首次建立目录/脚手架属于 **Phase 0** 工作，不得在 Phase 0 之前零散建目录、也不得把规划目录当作已存在目录。
- 不可随意修改：`docs/tech.md`（源规格，修改必须用户授权）、旧 migration（已“交付/应用”后禁止修改）、`src-tauri/capabilities/`、`tauri.conf.json`、锁文件；`docs/struct.md` 已被 `docs/tech.md` 取代，仅作历史参考。

## 4. Coding Rules

- 统一 Vue 3 Composition API + `<script setup lang="ts">`。
- 领域模型集中在 `src/models/`，共享类型不得散落在组件里；禁止 `any` 糊掉领域边界（TS 严格度见 `docs/DECISIONS.md` D-6，定案前模型/Repository/Engine 层必须无 `any`）。
- WeekRule 必须是结构化对象并序列化为 JSON；禁止 UI 直接操作 `"1-5、7-11单"` 字符串作为核心数据。
- 课程（Course）不保存星期/节次/老师/地点，这些属于 CourseSession；一门课程允许多个 Session。
- 同一数据只允许一个事实来源（SQLite → Repository → Pinia），禁止在 CourseCard/Grid/Store 各复制一份。
- 命名、组件、状态、错误处理、依赖管理细则见 `docs/CONVENTIONS.md`。

## 5. Frontend Rules

- 管理型 UI（设置、表单、弹窗、导入预览、错误提示）优先使用 Naive UI；主课表为自定义领域 UI，禁止表格组件实现。
- 路由集合固定：`/`、`/schedules`、`/schedule/:id/settings`、`/course/new`、`/course/:id/edit`、`/import`、`/export`、`/settings`（见 `docs/页面路由设计.md`）。
- 课程详情使用 NDrawer，不新增路由；新建课表用 Drawer/Modal；删除/危险操作必须 NDialog；设置页用 NTabs。
- 切周不重新查询 SQLite：课程加载一次 → Pinia 缓存 → Engine 计算。
- 空状态必须存在（无课表时 NEmpty +「创建课表/导入课表」），禁止白屏。

## 6. Backend/Tauri Rules

- Rust 侧仅 `src-tauri/src/commands/{file.rs, backup.rs, system.rs}` 三块能力；不新增 DB CRUD command。
- command 返回明确的成功/失败结构，错误转化为前端可展示信息，不得 panic 后让页面白屏。
- 权限最小化：`capabilities/` 只按功能最小授权，不一次放开整个文件系统。

## 7. Database Rules

- 所有数据库变化必须通过新增 migration；禁止修改旧 migration；连接后执行 `PRAGMA foreign_keys = ON;`。
- 删除关系必须考虑 `FOREIGN KEY ... ON DELETE CASCADE`（schedule/course/course_session/timetable 等设计见 `docs/DATABASE.md`）。
- 表/字段使用 snake_case；`week_rule` 为 JSON 字符串；`app_setting` 只保存真正的全局设置，存储层键名一律 snake_case（`theme` / `language` / `active_schedule_id` / `auto_backup` / `startup_behavior` 等；前端变量可用 camelCase 映射，SQLite key 一律 snake_case，见 `docs/DATABASE.md`）。
- 新建课表必须同一流程创建 `schedule + 默认 timetable + 默认 schedule_style`。
- 恢复备份必须校验版本/结构/引用 → 预览 → 确认 → 事务写入，失败回滚。

## 8. API Rules

- 项目没有 HTTP/网络 API；对外能力面是 Tauri command，对内能力面是 Repository / Engine / Importer 的类型化接口。
- 接口契约与签名以 `docs/API.md` 为准；任何 Agent 不得在组件中发明“新 API 层”（如 axios、全局 fetch 服务）替代 Repository/Store 约定；**新增/变更任何接口签名（Repository/Engine/Store/Importer/Tauri command）必须先同步 `docs/API.md`**。
- Importer 必须实现统一 `CourseImporter` 接口并走 `Parse → Validate → Preview → Confirm → Commit`，禁止解析后直写数据库。

## 9. Error Handling

- 数据库错误 → NNotification；导入错误 → NAlert + ImportErrorList；不可恢复错误 → Error Boundary。
- 不允许 `Uncaught Promise` 直接让页面崩掉；所有 async 入口必须有错误处理。
- 开发阶段日志 `console.debug/warn/error`；正式版统一 Logger（`logger.debug/info/warn/error`），实现方式见 `docs/DECISIONS.md` D-7。

## 10. Testing & Validation

- 必须测试范围：WeekRuleEngine、DateEngine、ConflictEngine、PositionEngine、CSV Importer、Backup Importer；重点覆盖连续周、单双周、自定义周、跨月、跨年、多时间段、冲突、调课、删除级联、自定义时间。
- 自动可执行的检查（单测/Lint/Format/Build）由 Agent 在命令落地后运行（命令表见 `docs/DEVELOPMENT.md`）；命令尚未落地（无 package.json）时，不得假装通过，须如实报告「无法执行，命令表待回填」。
- 需人工/交互的验收（重启后数据仍在、Tauri 窗口与视觉、交互体验）由用户验收；Agent 只执行可自动执行的部分并如实报告，不得自证通过。
- 未通过当前 Phase 验收标准，不得进入下一阶段；最终验收判定属于用户。

## 11. Git Rules

- 当前不是 Git 仓库：Git 规则在仓库初始化后生效；不要擅自 `git init`（除非用户明确要求）。
- 仓库存在后：小步提交、语义化提交信息；不提交运行时产物（node_modules、dist、target 等）；不使用破坏性 Git 命令；改动前先看 `git status`。

## 12. AI Agent Rules（Vibe Coding 约束）

修改任何代码前必须：

1. 先阅读相关现有代码和文档，不凭记忆或猜测；
2. 检查 `docs/tech.md` 与对应规范文档是否已定义该能力；
3. 不凭空创建抽象层（不发明不需要的 interface/service/base 类）；
4. 不重复实现已有功能（先搜索 `rg` 确认无现成实现）；
5. 不随意更换/新增依赖（先检查 package.json / Cargo.toml，新增依赖必须先说明并征求用户）；
6. 不擅自改变架构（目录、分层、路由集合、数据模型变更必须进 DECISIONS 并征求用户）；
7. 不为修复一个问题大范围重构，优先最小修改（small patch）；
8. 修改完成后主动运行相关检查（构建/测试/格式，命令见 DEVELOPMENT.md；脚手架未落地而无法运行时，记录为待执行并如实报告）；
9. 发现架构问题但不在当前任务范围时，只记录到 `docs/DECISIONS.md`，不顺手改；
10. 不确定时先检查项目现状，不是猜测；无法确定的内容标 `TODO` / `NEEDS_DECISION`，不编造。

## 13. Forbidden Actions

- 禁止实现闹钟/提醒/通知/倒计时/铃声等被明确排除的功能；
- 禁止更换技术栈（React/Electron/Element Plus/Ant Design Vue 等）；
- 禁止修改旧 migration、禁止绕过 Repository 直接 `db.select/execute`；
- 禁止在 Template/Component/CSS 里实现单双周、日期、冲突、位置算法；
- 禁止用 NDataTable/`<table>` 实现主课表；
- 禁止为修复小问题重写整个模块/项目；
- 禁止声称不存在的代码、库、表、命令或测试已存在；
- 禁止未授权修改 `docs/tech.md`、旧迁移、capabilities 与核心配置；
- 禁止跨阶段开发（未过当前 Phase 验收不得进入下一阶段）。

## 14. Definition of Done

一个功能只有同时满足以下六项才算完成：

```text
代码完成
+ UI 完成
+ 数据持久化完成
+ 错误处理完成
+ 测试完成
+ 重启验证完成
```

每完成一个 Phase 必须输出：修改文件清单、新增功能、数据库变化、新增测试、当前验收结果、已知问题、下一阶段建议（见 `docs/DEVELOPMENT.md`）。MVP 完成标准见 `docs/项目实施计划.md` 第 15 节 21 项清单。
