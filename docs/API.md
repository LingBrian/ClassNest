# API.md — ClassNest 接口契约

> 权威来源：`docs/tech.md`（第 8-14 节模型、19 节 Repository、21-25 节 Engine、41 节 Importer、52 节 Store）与 `docs/ARCHITECTURE.md`。
> **本项目没有 HTTP / 网络 API**。对外能力面是 Tauri command，对内能力面是 Repository / Engine / Importer / Store 的类型化接口。
> 当前仓库尚无代码（审计基线见 AGENTS.md §1），以下签名是「规划中的契约」，落地时不允许在组件中发明新的 API 层。

## 1. 契约优先级

```text
docs/tech.md 模型定义（最高）
→ 本文档签名（实现时必须一致）
→ 实际代码
```

- 新增/变更任何接口必须同步更新本文档。
- 禁止在组件中发明 axios、全局 fetch 服务等替代 Repository/Store 约定。
- 禁止返回原始 `{ rows }` 之类弱类型结果；Repository 一律返回 TypeScript 模型。

## 2. 领域模型（src/models/）

### 2.1 Schedule

```ts
interface Schedule {
  id: number
  name: string
  semesterStart: string      // YYYY-MM-DD
  currentWeek: number
  totalWeeks: number
  firstDayOfWeek: number     // 1=周一 … 7=周日
  sectionCount: number
  timeTableId?: number
  createdAt: string
  updatedAt: string
}
```

### 2.2 Course

```ts
interface Course {
  id: number
  scheduleId: number
  name: string
  color: string              // hex，如 #4C8DFF
  credits?: number | null
  note?: string | null
  createdAt: string
  updatedAt: string
}
```

> Course 不保存星期/节次/老师/地点，这些属于 CourseSession。

### 2.3 CourseSession

```ts
interface CourseSession {
  id: number
  courseId: number
  weekday: number            // 1=周一 … 7=周日
  startSection: number
  endSection: number
  startTime?: string | null  // HH:MM，仅自定义时间时存在
  endTime?: string | null
  teacher?: string | null
  location?: string | null
  weekRule: WeekRule
  dateStart?: string | null
  dateEnd?: string | null
  isCustomTime: boolean
}
```

### 2.4 WeekRule（JSON 存储）

```ts
interface WeekRule {
  type: 'range' | 'odd' | 'even' | 'custom'
  ranges: WeekRange[]
}
interface WeekRange {
  start: number
  end: number
  parity?: 'odd' | 'even'
}
```

### 2.5 CourseOverride

```ts
interface CourseOverride {
  id: number
  scheduleId: number
  courseSessionId: number
  originalDate: string       // YYYY-MM-DD
  type: 'move' | 'cancel' | 'replace'
  targetDate?: string | null
  startSection?: number | null
  endSection?: number | null
  location?: string | null
  teacher?: string | null
  note?: string | null
}
```

原则：`原课程 + Override = 最终课程`，只影响指定日期，不修改原课程。

### 2.6 ScheduleStyle

```ts
interface ScheduleStyle {
  scheduleId: number
  backgroundType: 'color' | 'image'
  backgroundValue: string
  showTime: boolean
  showLocation: boolean
  showTeacher: boolean
  showGrid: boolean
  showNonCurrentWeek: boolean
  nonCurrentWeekOpacity: number
  courseBorder: boolean
  courseRadius: number
  courseHeight: number
}
```

### 2.7 TimeTable / TimeSection

```ts
interface TimeTable {
  id: number
  name: string
  isDefault: boolean
  sections: TimeSection[]
}
interface TimeSection {
  id: number
  sectionNumber: number
  startTime: string          // HH:MM
  endTime: string            // HH:MM
}
```

### 2.8 AppSetting（全局键值）

```ts
type AppSettingKey =
  | 'theme' | 'language' | 'active_schedule_id'
  | 'auto_backup' | 'startup_behavior'
// 存储：app_setting(key TEXT PRIMARY KEY, value TEXT NOT NULL)
```

## 3. Engine 契约（src/engine/，纯函数、不依赖 Vue）

```ts
weekRuleEngine:
  isWeekMatched(weekRule: WeekRule, week: number): boolean
  getMatchedWeeks(weekRule: WeekRule, totalWeeks: number): number[]
  weekRulesIntersect(a: WeekRule, b: WeekRule): boolean   // 周数是否相交

dateEngine:
  getDateOfWeek(semesterStart, week, weekday, firstDayOfWeek = 1): string
  getCurrentWeek(semesterStart, today, firstDayOfWeek = 1): number   // >= 1
  timeToMinutes(time: string): number | null                          // HH:MM -> 分钟
  // 辅助：parseDate / toDateString / weekdayOf / startOfWeekDate

conflictEngine:
  sessionsOverlap(a: CourseSession, b: CourseSession): boolean
  detectConflicts(courses: CourseSession[]): CourseConflict[]
  interface CourseConflict { sessionA: CourseSession; sessionB: CourseSession }

positionEngine:
  getCoursePosition({
    startSection, endSection,
    startTime?, endTime?,       // 自定义时间（HH:MM），仅自定义时段使用
    timetable, lane?, laneCount?
  }): Position                  // Position：top / height / left / width（均为百分比）

scheduleEngine:
  // 统一输出，UI 只消费该结果
  build({
    schedule, courses, sessions, timetable,
    nonCurrentWeekOpacity?      // 默认 0.35
  }): RenderedCourse[]
```

周数/日期语义约定：包含 `semesterStart` 的那一周是第 1 周；周首按 `schedule.firstDayOfWeek`
对齐到学期开始之前最近的一个周首。`RenderedCourse.weekMatched` 为 WeekRule 与绝对日期区间
（dateStart/dateEnd）综合判定。

### 3.1 RenderedCourse（ScheduleEngine 统一输出）

```ts
interface RenderedCourse {
  courseId: number
  sessionId: number
  name: string
  color: string                  // hex，来自 Course.color
  weekday: number
  startSection: number
  endSection: number
  startTime: string              // 实际时刻（自定义时间优先，否则取时间表节次）HH:MM
  endTime: string
  teacher?: string
  location?: string
  weekMatched: boolean           // 当前周该时段是否生效
  conflict: boolean              // 是否存在冲突时段（weekday/周数/时间均相交）
  conflictCourseIds: number[]    // 冲突时段所属课程 id（去重）
  opacity: number                // 非当前周透明度（当前周为 1）
  top: number                    // 距日列顶部百分比 0-100
  height: number                 // 高度百分比 0-100
  left: number                   // 距日列左侧百分比 0-100（冲突分列）
  width: number                  // 宽度百分比 0-100（冲突分列）
}
```

### 3.2 冲突定义

同一 weekday + week 相交 + section 区间相交 ⇒ 冲突；使用自定义时间时额外按时间判断。冲突不删除后者，两个课程都保留并做冲突布局。

## 4. Repository 契约（src/repositories/，唯一 DB 访问口）

每个 Repository 提供成组方法：`findByXxx` / `findById` / `create` / `update` / `delete`，返回模型，不暴露 SQL。

```ts
ScheduleRepository         // 课表 CRUD；新建课表时同一流程创建 schedule + 默认 timetable + 默认 style
CourseRepository           // findByScheduleId(scheduleId) / findById / create / update / delete
CourseSessionRepository    // 课程时间段 CRUD
ScheduleStyleRepository    // 按 scheduleId 读写外观（Phase 4 落地）
SettingsRepository         // app_setting 键值读写（Phase 4 落地）
```

### 4.1 依赖注入（DECISIONS D-4，Phase 1 已落地）

- Repository 构造函数注入 `RepositoryDb`（`src/database/repository-db.ts`：`select<T>(sql, params?)` / `execute(sql, params?)`）。生产用 `getRepositoryDb()`（plugin-sql 适配），单测注入 better-sqlite3 内存适配器（`src/database/sqlite-test-adapter.ts`，test-only）。
- Repository 不直接依赖 plugin-sql 类型与连接单例实现细节。
- 已落地模型文件（`src/models/`）：schedule / course / session（含 WeekRule 与 JSON 序列化）/ timetable（含 DEFAULT_SECTION_TIMES 默认节次）/ scheduleStyle；override.ts 随 Phase 7。

## 5. Pinia Store 契约（src/stores/）

```ts
scheduleStore   // schedules、activeScheduleId、activeSchedule
                // loadSchedules() / switchSchedule() / createSchedule() / deleteSchedule() / updateSchedule()
courseStore     // 当前课表课程：加载、新增、编辑、删除、刷新
settingsStore   // 全局设置、课表外观（ScheduleStyle）、theme、language
uiStore         // Drawer / Modal / 当前周 / 导入弹窗 / 导出弹窗 等 UI 状态
```

状态原则：同一数据只有一个事实来源；Store 不得绕过 Repository 直接执行 SQL。

## 6. Importer 契约（src/importers/）

```ts
interface CourseImporter {
  id: string
  name: string
  canHandle(input: ImportInput): Promise<boolean>
  parse(input: ImportInput): Promise<ImportedSchedule>
}
```

管线（禁止短路直写 DB）：

```text
ImportInput → ImporterRegistry → Importer → ImportedSchedule
→ Validate → Preview（课程数/时间段数/异常数/冲突数）→ Confirm → Commit
```

已知实现计划：
- `registry.ts`（`src/importers/`）：ImporterRegistry
- `csv/CsvImporter.ts`（Phase 5，首期实现）
- `html/GenericHtmlImporter.ts`（Phase 8）
- `backup/BackupImporter.ts`（Phase 6：版本验证 → 结构验证 → 引用检查 → 预览 → 确认 → 事务写入，失败回滚）

## 7. Exporter 契约（src/exporters/）

```ts
csvExporter     // 导出当前课表（默认）/ 全部课表
                // 字段：课程名称、星期、开始节、结束节、老师、地点、周数
icsExporter     // DTSTART / DTEND / SUMMARY / LOCATION / DESCRIPTION
                // 禁止生成 VALARM
backupExporter  // 完整 JSON 备份，结构见下
```

备份 JSON 结构：

```json
{
  "version": 1,
  "exportedAt": "...",
  "schedules": [],
  "courses": [],
  "courseSessions": [],
  "courseOverrides": [],
  "timetables": [],
  "scheduleStyles": []
}
```

必须包含 `version` / `exportedAt` 与各表数据。

## 8. Service 契约（src/services/）

```ts
backupService     // 完整/部分备份与恢复（事务、回滚）
fileService       // 文件读写（经 Tauri 原生命令）
settingsService   // 全局设置编排
```

## 9. Tauri Command 契约（src-tauri/src/commands/）

只承担原生能力，不为普通 DB CRUD 写命令：

```text
file.rs     文件系统（读写/选择文件）
backup.rs   备份文件读写
system.rs   系统信息 / 原生窗口 / 托盘
```

规则：
- command 返回明确的成功/失败结构（`{ ok: true, data }` / `{ ok: false, error }` 或等价结构），错误转化为前端可展示信息。
- 禁止 panic 后让页面白屏；错误必须可展示。
- 权限最小化：`capabilities/` 按功能最小授权，不一次放开整个文件系统。

## 10. 接口变更流程

1. 先确认是否属于 NEEDS_DECISION 范围（新增/改名模型字段、跨层接口、目录变化必须先进 `docs/DECISIONS.md`）；
2. 修改 `docs/tech.md`（需用户授权）或本文档；
3. 再落地代码；落地顺序：models → repositories/migration → engine → stores → services → UI → tests；
4. 变更既有签名后，用 `rg` 搜索全部调用方并同步修改（严禁只改一侧）；
5. 新增/新增方法只允许落在既定契约内（Repository ×5、Store ×4、Engine ×6、Importer 统一接口）；新增**接口类型**（新的 Service / Repository）属架构变更，必须登记 DECISIONS 并征求用户；
6. 输出 Completion Rule 小结（见 DEVELOPMENT.md）。

## 11. Tauri Command 修改规范

- 前端一律通过 Tauri `invoke` 调用白名单 command，禁止编造不存在的 command 名；command 名与实现一一对应，改名必须同步全部前端调用处。
- command 一律返回统一成功/失败结构（`{ ok: true, data }` / `{ ok: false, error }` 或等价结构），错误信息可被前端直接展示，不使用 panic 表达错误。
- command 只返回原语/序列化 JSON，不返回业务对象；业务组装由前端 Service/Store 完成。
- 只允许在 `file.rs` / `backup.rs` / `system.rs` 内**新增函数**；新增 command 文件、修改 `capabilities/`、`tauri.conf.json` 均属「不可随意修改」，必须先征求用户。
- 普通 DB CRUD 不建 command（由 Repository + `@tauri-apps/plugin-sql` 完成）。