# ClassNest 架构规范

> 权威来源：`docs/tech.md`（第 3、6、7、19、20-25、51、54 节）与 `docs/项目架构设计.md`。
> 本文档是 AGENTS.md 的细化，只记录已定的事实/约定；未落地的代码路径明确标注。

## 1. 当前实现状态（审计基线）

截至 2026-08-29，Phase 0 与 Phase 1（第一切片）已落地：

- 脚手架已存在：`package.json`/`Cargo.toml`/`src/`/`src-tauri/`、pnpm/Vitest/ESLint/Prettier 工具链、migration 0001-0004 与幂等测试（见 DECISIONS N-2）。
- Phase 1 已落地（第一切片）：`models/`（schedule/course/session/timetable/scheduleStyle）、三个 Repository（Schedule/Course/CourseSession，含新建课表三件套与 RepositoryDb 依赖注入）、`stores/`（schedule/course）及其单测。
- **尚未实现**：视图/组件业务 UI、Engine、Importer/Exporter、调课（Override）、备份、Git 仓库。
- 下文未标注「已落地」的目录与接口仍为 tech.md 规定的**目标结构**，属于规划。

## 2. 架构形态

本地优先桌面单体应用，无服务端、无网络 API：

```text
┌──────────────────────────────────────────────┐
│            Vue 3 UI（Views + Components）      │
├──────────────┬───────────────────────────────┤
│ Pinia Stores │  src/engine（纯领域逻辑）       │
├──────────────┴───────────────┬───────────────┤
│         Repositories         │               │
├──────────────┬───────────────┘               │
│ SQLite       │  Tauri/Rust 原生命令           │
├──────────────┴───────────────────────────────┤
│ @tauri-apps/plugin-sql（前端访问 SQLite）      │
└──────────────────────────────────────────────┘
```

强制单向依赖：

```text
SQLite
  ↓
Repository
  ↓
Pinia Store
  ↓
Engine → RenderedCourse
  ↓
UI
```

## 3. 目标目录结构

### 3.1 前端（`src/`，源自 tech.md 第 6 节）

```text
src/
├── views/                 ScheduleView / ScheduleManagerView / CourseEditorView /
│                          ScheduleSettingsView / ImportView / ExportView / GlobalSettingsView
├── components/
│   ├── schedule-grid/     ScheduleGrid / ScheduleHeader / WeekNavigator / TimeAxis /
│   │                      DayColumn / CurrentDayIndicator / CourseCard /
│   │                      ConflictCourseCard / GridBackground（D-1 已定：主课表 Grid 归本目录）
│   ├── course/            CourseDetail / CourseEditor / CourseSessionEditor / CourseSessionList
│   ├── schedule/          ScheduleSwitcher / ScheduleManager / ScheduleCreateDialog（D-1 已定）
│   ├── settings/          ScheduleSettingsForm / ScheduleAppearanceForm / TimeTableEditor / GlobalSettingsForm
│   ├── import/            ImportDialog / ImportTypeSelector / CsvImporter / HtmlImporter /
│   │                      BackupImporter / ImportPreview / ImportErrorList
│   └── common/            AppHeader / EmptyState / ConfirmDialog / LoadingState
├── stores/                schedule.ts / course.ts / settings.ts / ui.ts（前两者 Phase 1 已落地）
├── models/                schedule.ts / course.ts / session.ts / override.ts / timetable.ts /
│                          scheduleStyle.ts（Phase 1 已落地前五个，scheduleStyle 随三件套）
├── engine/                scheduleEngine.ts / weekEngine.ts / dateEngine.ts /
│                          conflictEngine.ts / positionEngine.ts / weekRuleEngine.ts
├── repositories/          ScheduleRepository.ts / CourseRepository.ts /
│                          CourseSessionRepository.ts / ScheduleStyleRepository.ts / SettingsRepository.ts
├── database/              connection.ts / database.ts / migrations/0001..0004.sql
├── importers/             types.ts / registry.ts / csv/CsvImporter.ts /
│                          html/GenericHtmlImporter.ts / backup/BackupImporter.ts
├── exporters/             csvExporter.ts / icsExporter.ts / backupExporter.ts
├── services/              backupService.ts / fileService.ts / settingsService.ts
├── utils/                 （内容未在 tech.md 中定义 → TODO）
├── router/index.ts
└── App.vue
```

> 已解决（DECISIONS D-1，2026-08-29）：`components/schedule/` 同名冲突按方案 1 拆分——主课表 Grid 组件归 `components/schedule-grid/`，课表切换/管理/新建归 `components/schedule/`；上面目录树已更新为该命名。

### 3.2 Tauri（`src-tauri/`，源自 tech.md 第 7 节）

```text
src-tauri/
├── src/
│   ├── main.rs
│   ├── lib.rs
│   └── commands/
│       ├── file.rs       # 文件系统
│       ├── backup.rs     # 备份文件
│       └── system.rs     # 系统信息 / 原生窗口 / 托盘
├── migrations/           # Tauri 侧迁移（按需）
├── capabilities/         # 权限最小化
└── tauri.conf.json
```

Rust 不承担数据库 CRUD。

## 4. 领域模型与核心引擎

### 4.1 模型职责（源自 tech.md 第 8-14 节）

| 模型 | 职责 |
| --- | --- |
| Schedule | 课表信息：名称、学期开始、当前周、总周数、周起始日、节数、时间表引用 |
| Course | 仅课程本身：名称、颜色、学分、备注；**不保存**星期/节次/老师/地点 |
| CourseSession | 时间段：星期、起止节次、老师、地点、WeekRule、可选日期区间、自定义时间 |
| WeekRule | 结构化周数规则（JSON 字符串存储）：range / odd / even / custom |
| CourseOverride | 调课：move / cancel / replace，只影响指定日期，不修改原课程 |
| ScheduleStyle | 课表外观（属于课表，不属于全局） |
| TimeTable / TimeSection | 独立时间表与节次 |
| AppSetting | 全局 key-value：theme / language / active_schedule_id / auto_backup / startup_behavior（存储 key 一律 snake_case；前端 Store 可用 camelCase 字段名映射） |

### 4.2 Engine 契约（源自 tech.md 第 21-25 节）

```text
weekRuleEngine.isWeekMatched(weekRule, week): boolean
weekRuleEngine.getMatchedWeeks(weekRule, totalWeeks): number[]
weekRuleEngine.weekRulesIntersect(a, b): boolean   // 两个周规则是否存在相交周数
dateEngine.getDateOfWeek(semesterStart, week, weekday, firstDayOfWeek = 1): string
dateEngine.getCurrentWeek(semesterStart, today, firstDayOfWeek = 1): number
dateEngine.timeToMinutes(time): number | null       // HH:MM -> 分钟
conflictEngine.sessionsOverlap(a, b): boolean       // 冲突判定谓词（周过滤/冲突唯一来源）
conflictEngine.detectConflicts(courses): CourseConflict[]
positionEngine.getCoursePosition({ startSection, endSection, timetable }): Position
scheduleEngine.build({ schedule, courses, sessions, timetable }) → RenderedCourse[]
```

`RenderedCourse` 至少包含：courseId、sessionId、name、color、weekday、startSection、endSection、startTime、endTime、teacher、location、weekMatched、conflict、conflictCourseIds、opacity、top、height、left、width（top/height/left/width 均为 0-100 百分比，供 CSS 绝对定位与冲突分列）。UI 只消费该结果。

周数语义：包含 `semesterStart` 的那一周是第 1 周；周首按 `firstDayOfWeek` 对齐到学期开始之前最近的周首。当前周（`getCurrentWeek`）与 `weekMatched` 都基于这一约定。

### 4.3 冲突定义

课程冲突 = 同一 weekday + 周数相交 + section 区间相交；使用自定义时间时额外按时间判断。冲突**不删除后者**，两个课程都要保留并做冲突布局。

## 5. 关键流程

- 主课表渲染：启动加载课表 → 无课表显示空状态；一次性加载课程进 Pinia；切周只由 Engine 重算，不重新查库；仅在课程/课表/设置变更时刷新。
- 新建课表：同一流程创建 `schedule + 默认 timetable + 默认 style`。
- 导入：`ImportInput → ImporterRegistry → Importer → ImportedSchedule → Validate → Preview → Confirm → Commit`。
- 备份/恢复：完整 JSON（version + exportedAt + schedules/courses/courseSessions/courseOverrides/timetables/scheduleStyles）；恢复 = 版本验证 → 结构验证 → 引用检查 → 预览 → 确认 → 事务写入，失败回滚。
- 调课：`原课程 + Override = 最终课程`，仅影响指定日期。

## 6. 路由集合（源自 tech.md 第 51 节）

```text
/                     ScheduleView
/schedules            ScheduleManagerView
/schedule/:id/settings ScheduleSettingsView
/course/new           CourseEditorView
/course/:id/edit      CourseEditorView
/import               ImportView
/export               ExportView
/settings             GlobalSettingsView
```

课程详情不建路由，使用 NDrawer。详细规则见 `docs/页面路由设计.md`。

## 7. 职责边界

| 层 | 允许做什么 | 禁止做什么 |
| --- | --- | --- |
| View / Component | 组装 UI、调 Store、展示 Engine 输出 | 直接访问 SQLite；实现领域算法；复制数据副本 |
| Pinia Store | 缓存与协调当前课表/课程/设置/UI 状态 | 写 SQL；绕过 Repository |
| Repository | 唯一 DB 访问口，模型与表映射 | 业务规则；UI 状态 |
| Engine | 纯计算，不依赖 Vue | 调 DB；调 Store；持有 UI 状态 |
| Importer/Exporter | 解析、校验、预览、转换统一模型 | 解析后直写 DB |
| Service | 备份/文件/设置等跨层编排 | 成为无意义的薄包装层 |
| Tauri/Rust | 文件系统、系统信息、备份、原生窗口、托盘 | DB CRUD；业务逻辑 |

## 8. 性能与持久化

- 课程加载一次 → Pinia cache → Engine 计算；切周不查询 SQLite；不因鼠标移动触发 `SELECT`。
- 全部数据落 SQLite；重启后数据存在；Schema 变更走 migration。
- 日志：开发 `console.debug/warn/error`；正式版统一 Logger（实现待定，NEEDS_DECISION 见 `docs/DECISIONS.md` D-7）。

Tauri 边界补充（配合 `docs/API.md` §11）：

- 前端唯一调用 Rust 的入口是 Tauri `invoke` + `capabilities/` 白名单；不经白名单权限的功能一律不在代码里“绕过”。
- command 只返回原语/序列化 JSON 与统一成功/失败结构，不返回业务对象；业务组装由前端 Service/Store 完成。
- 新增 command 文件、修改 `capabilities/` 与 `tauri.conf.json` 属「不可随意修改」，必须先征求用户。

## 9. 未定义项（禁止猜测，落地前先决策）

- `src/utils/` 的具体内容；
- `components/schedule/` 同名目录冲突的拆分方式；
- 路由 History 模式（页面路由文档建议打包用 Hash，tech.md 未定）；
- 测试框架与 Lint/Format 工具链（无 package.json）；
- 包管理器选型；
- Migration runner 与 app schema version 管理方式。

以上全部属于待决策项，详见 `docs/DECISIONS.md`。
