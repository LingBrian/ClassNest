# WakeUp 风格课程表桌面替代品
## Vibe Coding 开发总规格

> 项目定位：  
> 使用 Vue 3 + Naive UI + Tauri + SQLite 构建一个本地优先的桌面课程表应用。
>
> 产品目标：  
> **尽可能复刻 WakeUp 课程表的核心使用体验和数据能力，但明确不实现闹钟、上课提醒、后台通知等提醒型功能。**
>
> 开发目标：  
> 让 AI Coding Agent 能够按照明确的架构、数据模型、开发顺序和验收标准持续开发，而不是一次性自由生成整个项目。

---

# 1. 产品原则

## 1.1 核心定位

这是一个：

- 本地优先
- 桌面端优先
- 无账号
- 无广告
- 无上课闹钟
- 无上课通知
- 支持多课表
- 支持复杂周数规则
- 支持课程冲突
- 支持导入导出
- 高度可定制

的课程表应用。

核心体验：

> 打开应用之后，不需要经过任何首页跳转，直接看到当前课表。

---

# 2. 明确不做什么

以下功能明确排除：

```text
❌ 闹钟
❌ 上课提醒
❌ 系统通知
❌ 后台提醒任务
❌ 倒计时
❌ 铃声
❌ 手机端 Widget
❌ 教务系统自动登录
```

以下功能可以后置：

```text
⏳ 在线分享
⏳ 大规模学校教务适配
⏳ 桌面悬浮课程窗口
⏳ 系统托盘高级功能
```

第一目标不是“功能最多”，而是：

> **把 WakeUp 最核心的课程表体验做正确。**

---

# 3. 技术栈

## 3.1 Frontend

必须使用：

```text
Vue 3
Vite
TypeScript
Pinia
Vue Router
Naive UI
SCSS
```

推荐：

```text
<script setup lang="ts">
```

统一使用 Composition API。

---

# 4. Naive UI 使用原则

Naive UI 是本项目默认的管理型 UI 框架。

必须优先使用 Naive UI：

```text
NButton
NInput
NInputNumber
NSelect
NDatePicker
NColorPicker
NSwitch
NCheckbox
NRadio
NRadioGroup
NForm
NFormItem
NModal
NDrawer
NDialog
NDropdown
NPopover
NTooltip
NCard
NDataTable
NScrollbar
NTabs
NDescriptions
NAlert
NTag
NSpace
NEmpty
NSpin
NMessageProvider
NDialogProvider
NNotificationProvider
```

但：

> **主课表 Schedule Grid 禁止直接依赖 Naive UI 的表格组件实现。**

不要使用：

```text
NDataTable
<table>
```

作为课表主体。

主课表必须使用：

```text
CSS Grid
+
absolute positioning
+
Vue components
```

原因：

课程卡片需要支持：

- 跨多个节次
- 自定义高度
- 自定义时间
- 冲突布局
- 非本周课程透明度
- 课程颜色
- 动态边距
- 网格辅助线

这些属于领域 UI，不应该强行塞进通用 Table。

---

# 5. UI 设计原则

整体视觉方向：

```text
简洁
轻量
高信息密度
低视觉噪音
桌面应用感
```

主课表必须是视觉中心。

管理页可以明显使用 Naive UI。

推荐结构：

```text
主课表
→ 自定义 UI

设置
→ Naive UI

弹窗
→ Naive UI

表单
→ Naive UI

导入预览
→ Naive UI

错误提示
→ Naive UI
```

---

# 6. 前端目录

最终目录：

```text
src/
│
├── views/
│   ├── ScheduleView.vue
│   ├── ScheduleManagerView.vue
│   ├── CourseEditorView.vue
│   ├── ScheduleSettingsView.vue
│   ├── ImportView.vue
│   ├── ExportView.vue
│   └── GlobalSettingsView.vue
│
├── components/
│   │
│   ├── schedule/
│   │   ├── ScheduleGrid.vue
│   │   ├── ScheduleHeader.vue
│   │   ├── WeekNavigator.vue
│   │   ├── TimeAxis.vue
│   │   ├── DayColumn.vue
│   │   ├── CurrentDayIndicator.vue
│   │   ├── CourseCard.vue
│   │   ├── ConflictCourseCard.vue
│   │   └── GridBackground.vue
│   │
│   ├── course/
│   │   ├── CourseDetail.vue
│   │   ├── CourseEditor.vue
│   │   ├── CourseSessionEditor.vue
│   │   └── CourseSessionList.vue
│   │
│   ├── schedule/
│   │   ├── ScheduleSwitcher.vue
│   │   ├── ScheduleManager.vue
│   │   └── ScheduleCreateDialog.vue
│   │
│   ├── settings/
│   │   ├── ScheduleSettingsForm.vue
│   │   ├── ScheduleAppearanceForm.vue
│   │   ├── TimeTableEditor.vue
│   │   └── GlobalSettingsForm.vue
│   │
│   ├── import/
│   │   ├── ImportDialog.vue
│   │   ├── ImportTypeSelector.vue
│   │   ├── CsvImporter.vue
│   │   ├── HtmlImporter.vue
│   │   ├── BackupImporter.vue
│   │   ├── ImportPreview.vue
│   │   └── ImportErrorList.vue
│   │
│   └── common/
│       ├── AppHeader.vue
│       ├── EmptyState.vue
│       ├── ConfirmDialog.vue
│       └── LoadingState.vue
│
├── stores/
│   ├── schedule.ts
│   ├── course.ts
│   ├── settings.ts
│   └── ui.ts
│
├── models/
│   ├── schedule.ts
│   ├── course.ts
│   ├── session.ts
│   ├── override.ts
│   └── timetable.ts
│
├── engine/
│   ├── scheduleEngine.ts
│   ├── weekEngine.ts
│   ├── dateEngine.ts
│   ├── conflictEngine.ts
│   ├── positionEngine.ts
│   └── weekRuleEngine.ts
│
├── repositories/
│   ├── ScheduleRepository.ts
│   ├── CourseRepository.ts
│   ├── CourseSessionRepository.ts
│   ├── ScheduleStyleRepository.ts
│   └── SettingsRepository.ts
│
├── database/
│   ├── connection.ts
│   ├── migrations/
│   │   ├── 0001_initial.sql
│   │   ├── 0002_course_override.sql
│   │   ├── 0003_schedule_style.sql
│   │   └── 0004_app_settings.sql
│   └── database.ts
│
├── importers/
│   ├── types.ts
│   ├── registry.ts
│   ├── csv/
│   │   └── CsvImporter.ts
│   ├── html/
│   │   └── GenericHtmlImporter.ts
│   └── backup/
│       └── BackupImporter.ts
│
├── exporters/
│   ├── csvExporter.ts
│   ├── icsExporter.ts
│   └── backupExporter.ts
│
├── services/
│   ├── backupService.ts
│   ├── fileService.ts
│   └── settingsService.ts
│
├── utils/
│
├── router/
│   └── index.ts
│
└── App.vue
```

---

# 7. Tauri 目录

```text
src-tauri/
│
├── src/
│   ├── main.rs
│   ├── lib.rs
│   │
│   └── commands/
│       ├── file.rs
│       ├── backup.rs
│       └── system.rs
│
├── migrations/
│
├── capabilities/
│
└── tauri.conf.json
```

原则：

> SQLite CRUD 尽量由前端 Repository + `@tauri-apps/plugin-sql` 完成。

Rust command 只承担真正需要原生能力的事情：

```text
文件系统
系统信息
备份
原生窗口
托盘
```

不要为了普通数据库 CRUD 创建大量 Rust command。

---

# 8. 数据模型

## 8.1 Schedule

表示“一整张课表”。

```ts
interface Schedule {
  id: number

  name: string

  semesterStart: string

  currentWeek: number

  totalWeeks: number

  firstDayOfWeek: number

  sectionCount: number

  timeTableId?: number

  createdAt: string
  updatedAt: string
}
```

---

# 9. Course

课程本身。

```ts
interface Course {
  id: number

  scheduleId: number

  name: string

  color: string

  credits?: number | null

  note?: string | null

  createdAt: string

  updatedAt: string
}
```

注意：

> Course 不保存具体星期、节次、老师、地点。

这些属于 CourseSession。

---

# 10. CourseSession

课程的一个时间段。

```ts
interface CourseSession {
  id: number

  courseId: number

  weekday: number

  startSection: number

  endSection: number

  startTime?: string | null

  endTime?: string | null

  teacher?: string | null

  location?: string | null

  weekRule: WeekRule

  dateStart?: string | null

  dateEnd?: string | null

  isCustomTime: boolean
}
```

一门课程允许多个 Session：

```text
高等数学

Session 1
周一
1-2 节
第 1-16 周

Session 2
周三
5-6 节
第 1-8 周

Session 3
周五
3-4 节
第 10-16 周
```

---

# 11. WeekRule

数据库中使用 JSON 字符串保存。

TypeScript：

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

例如：

```json
{
  "type": "custom",
  "ranges": [
    {
      "start": 1,
      "end": 5
    },
    {
      "start": 7,
      "end": 11,
      "parity": "odd"
    }
  ]
}
```

禁止在 UI 中直接操作字符串：

```text
"1-5、7-11单"
```

UI 输入之后必须先转换成结构化对象。

---

# 12. CourseOverride

用于调课。

不要修改原课程。

```ts
interface CourseOverride {
  id: number

  scheduleId: number

  courseSessionId: number

  originalDate: string

  type: 'move' | 'cancel' | 'replace'

  targetDate?: string | null

  startSection?: number | null

  endSection?: number | null

  location?: string | null

  teacher?: string | null

  note?: string | null
}
```

核心原则：

```text
原课程
+
Override
=
最终课程
```

---

# 13. ScheduleStyle

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

所有这些配置属于 Schedule，而不是全局配置。

---

# 14. TimeTable

时间表独立出来。

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

  startTime: string

  endTime: string
}
```

例如：

```text
1 08:00 - 08:45
2 08:55 - 09:40
3 10:00 - 10:45
4 10:55 - 11:40
...
```

---

# 15. SQLite Schema

## migration: 0001_initial.sql

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,

    semester_start TEXT NOT NULL,

    current_week INTEGER NOT NULL DEFAULT 1,

    total_weeks INTEGER NOT NULL DEFAULT 20,

    first_day_of_week INTEGER NOT NULL DEFAULT 1,

    section_count INTEGER NOT NULL DEFAULT 12,

    time_table_id INTEGER,

    created_at TEXT NOT NULL,

    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    schedule_id INTEGER NOT NULL,

    name TEXT NOT NULL,

    color TEXT NOT NULL,

    credits REAL,

    note TEXT,

    created_at TEXT NOT NULL,

    updated_at TEXT NOT NULL,

    FOREIGN KEY(schedule_id)
        REFERENCES schedule(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    course_id INTEGER NOT NULL,

    weekday INTEGER NOT NULL,

    start_section INTEGER NOT NULL,

    end_section INTEGER NOT NULL,

    start_time TEXT,

    end_time TEXT,

    teacher TEXT,

    location TEXT,

    week_rule TEXT NOT NULL,

    date_start TEXT,

    date_end TEXT,

    is_custom_time INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY(course_id)
        REFERENCES course(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    is_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS timetable_section (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    timetable_id INTEGER NOT NULL,

    section_number INTEGER NOT NULL,

    start_time TEXT NOT NULL,

    end_time TEXT NOT NULL,

    FOREIGN KEY(timetable_id)
        REFERENCES timetable(id)
        ON DELETE CASCADE
);
```

---

# 16. migration: 0002_course_override.sql

```sql
CREATE TABLE IF NOT EXISTS course_override (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    schedule_id INTEGER NOT NULL,

    course_session_id INTEGER NOT NULL,

    original_date TEXT NOT NULL,

    type TEXT NOT NULL,

    target_date TEXT,

    start_section INTEGER,

    end_section INTEGER,

    location TEXT,

    teacher TEXT,

    note TEXT,

    FOREIGN KEY(schedule_id)
        REFERENCES schedule(id)
        ON DELETE CASCADE,

    FOREIGN KEY(course_session_id)
        REFERENCES course_session(id)
        ON DELETE CASCADE
);
```

---

# 17. migration: 0003_schedule_style.sql

```sql
CREATE TABLE IF NOT EXISTS schedule_style (
    schedule_id INTEGER PRIMARY KEY,

    background_type TEXT NOT NULL DEFAULT 'color',

    background_value TEXT NOT NULL DEFAULT '#ffffff',

    show_time INTEGER NOT NULL DEFAULT 1,

    show_location INTEGER NOT NULL DEFAULT 1,

    show_teacher INTEGER NOT NULL DEFAULT 0,

    show_grid INTEGER NOT NULL DEFAULT 1,

    show_non_current_week INTEGER NOT NULL DEFAULT 1,

    non_current_week_opacity REAL NOT NULL DEFAULT 0.35,

    course_border INTEGER NOT NULL DEFAULT 0,

    course_radius REAL NOT NULL DEFAULT 8,

    course_height REAL NOT NULL DEFAULT 1,

    FOREIGN KEY(schedule_id)
        REFERENCES schedule(id)
        ON DELETE CASCADE
);
```

---

# 18. migration: 0004_app_settings.sql

```sql
CREATE TABLE IF NOT EXISTS app_setting (
    key TEXT PRIMARY KEY,

    value TEXT NOT NULL
);
```

例如：

```text
theme
language
active_schedule_id
auto_backup
startup_behavior
```

---

# 19. Repository 层

所有数据库操作必须经过 Repository。

例如：

```ts
class CourseRepository {
  async findByScheduleId(scheduleId: number)
  async findById(id: number)
  async create(course: Course)
  async update(course: Course)
  async delete(id: number)
}
```

禁止 View 直接：

```ts
db.select(...)
```

禁止 Component 直接访问 SQLite。

正确：

```text
Component
    ↓
Pinia Store
    ↓
Repository
    ↓
SQLite
```

---

# 20. Schedule Engine

这是整个项目最重要的模块。

必须独立于 Vue。

目录：

```text
engine/
├── scheduleEngine.ts
├── weekEngine.ts
├── dateEngine.ts
├── conflictEngine.ts
├── positionEngine.ts
└── weekRuleEngine.ts
```

---

# 21. WeekRuleEngine

必须提供：

```ts
isWeekMatched(
  weekRule: WeekRule,
  week: number
): boolean
```

以及：

```ts
getMatchedWeeks(
  weekRule: WeekRule,
  totalWeeks: number
): number[]
```

测试：

```text
1-16
1-8 单周
2-16 双周
1-5、7-11
```

全部必须有单元测试。

---

# 22. DateEngine

必须提供：

```ts
getDateOfWeek(
  semesterStart: string,
  week: number,
  weekday: number
): string
```

以及：

```ts
getCurrentWeek(...)
```

必须正确处理：

```text
跨月份
跨年份
星期一作为第一天
星期日作为第一天
```

---

# 23. ScheduleEngine

统一输出：

```ts
interface RenderedCourse {
  courseId: number

  sessionId: number

  name: string

  weekday: number

  startSection: number

  endSection: number

  startTime: string

  endTime: string

  teacher?: string

  location?: string

  weekMatched: boolean

  conflict: boolean

  conflictCourseIds: number[]

  opacity: number

  top: number

  height: number
}
```

UI 只消费这个结果。

---

# 24. ConflictEngine

提供：

```ts
detectConflicts(
  courses: CourseSession[]
): CourseConflict[]
```

课程只要满足：

```text
weekday 相同
+
week 相交
+
section 区间相交
```

就视为冲突。

如果使用自定义时间，还要额外根据时间判断。

冲突不能简单删除后者。

必须保留两个课程。

---

# 25. PositionEngine

负责：

```text
top
height
left
width
```

例如：

```ts
getCoursePosition({
  startSection,
  endSection,
  timetable
})
```

主课表不负责计算。

---

# 26. 主界面

Route：

```text
/
```

页面：

```text
ScheduleView.vue
```

结构：

```text
ScheduleView
│
├── ScheduleHeader
│
├── WeekNavigator
│
├── ScheduleGrid
│   ├── TimeAxis
│   ├── WeekHeader
│   ├── DayColumn × 7
│   └── CourseCard
│
└── MorePanel
```

---

# 27. Schedule Header

包含：

```text
当前课表名称
当前周
当前日期范围

新增
导入
导出
更多
```

点击课表名称：

```text
ScheduleSwitcher
```

使用：

```text
NDropdown
```

---

# 28. WeekNavigator

至少支持：

```text
上一周
下一周
今天
输入周数
```

并支持：

```text
当前周高亮
非本学期周数
```

---

# 29. ScheduleGrid

不要使用：

```text
NDataTable
HTML table
```

使用：

```text
CSS Grid
```

基础布局：

```css
grid-template-columns:
  72px
  repeat(7, minmax(120px, 1fr));
```

---

# 30. CourseCard

课程卡需要显示：

```text
课程名称
地点
老师
时间
```

显示内容由 ScheduleStyle 控制。

示例：

```text
┌────────────────────┐
│ 高等数学            │
│ 张老师              │
│ 逸夫楼 101          │
│ 08:00 - 09:40       │
└────────────────────┘
```

点击：

```text
NDrawer
```

展示课程详情。

---

# 31. CourseDetail

显示：

```text
课程名称
老师
地点
学分
备注

所有时间段
```

底部：

```text
编辑
删除
```

删除必须使用：

```text
NDialog
```

确认。

---

# 32. CourseEditor

新增和编辑使用同一组件。

表单：

```text
课程名称
颜色
学分
备注
```

使用：

```text
NForm
NFormItem
NInput
NColorPicker
NInputNumber
```

---

# 33. CourseSessionEditor

时间段编辑：

```text
星期
开始节
结束节
周数
老师
地点

[ ] 使用自定义时间

开始时间
结束时间
```

周数输入不能只使用纯文本。

必须提供：

```text
第 1 - 16 周
单双周
自定义周数
```

并在 UI 上将结果预览成：

```text
1 2 3 4 5 6 7 8 ...
```

---

# 34. 新建课表

必须支持：

```text
课表名称
学期开始日期
总周数
当前周
每天节数
```

创建后：

```text
schedule
+
默认 timetable
+
默认 style
```

必须在同一流程完成。

---

# 35. 多课表

Route：

```text
/schedules
```

页面：

```text
ScheduleManagerView
```

功能：

```text
查看所有课表
切换
新增
复制
重命名
删除
```

点击删除时：

```text
NDialog
```

必须明确：

> 删除课表会同时删除课程、时间段、调课和外观配置。

---

# 36. Schedule Settings

Route：

```text
/schedule/:id/settings
```

使用：

```text
NTabs
```

Tab：

```text
基本设置
时间表
外观
高级
```

---

# 37. 基本设置

包含：

```text
课表名称
学期开始日期
当前周
学期总周数
一天课程节数
周起始日
```

修改时实时保存或者显式点击保存，但整个项目必须统一一种策略。

推荐：

```text
普通字段：保存按钮
外观设置：实时保存
```

---

# 38. 时间表编辑器

使用：

```text
NDataTable
```

显示：

```text
节次
开始时间
结束时间
```

支持：

```text
新增
编辑
删除
上下移动
恢复默认
```

默认时间表：

```text
不能删除
不能重命名
```

---

# 39. 外观设置

使用 Naive UI：

```text
NColorPicker
NSlider
NSwitch
NRadioGroup
```

设置：

```text
背景
课程颜色
圆角
透明度
课程高度
网格
显示时间
显示地点
显示老师
显示非当前周课程
```

必须提供 Live Preview。

设置左侧。

右侧直接显示：

```text
ScheduleGrid
```

---

# 40. 导入系统

架构：

```text
ImportInput
    ↓
ImporterRegistry
    ↓
Importer
    ↓
ImportedSchedule
    ↓
Validation
    ↓
Preview
    ↓
Commit
```

所有 Importer 必须输出统一模型。

---

# 41. Importer 接口

```ts
interface CourseImporter {
  id: string

  name: string

  canHandle(
    input: ImportInput
  ): Promise<boolean>

  parse(
    input: ImportInput
  ): Promise<ImportedSchedule>
}
```

---

# 42. 第一阶段只实现 CSV

入口：

```text
导入
→ CSV
```

支持：

```text
课程名称
星期
开始节
结束节
老师
地点
周数
```

解析后不能直接写数据库。

必须经过：

```text
Parse
↓
Validate
↓
Preview
↓
Confirm
↓
Database
```

---

# 43. Import Preview

显示：

```text
课程数
时间段数
异常数
冲突数
```

表格：

```text
课程
星期
节次
周数
老师
地点
状态
```

状态：

```text
✓ 正常
⚠ 警告
✕ 错误
```

用户点击：

```text
确认导入
```

才真正写入 SQLite。

---

# 44. HTML Import

第二阶段实现。

结构：

```text
选择 HTML
↓
选择解析器
↓
解析
↓
预览
↓
确认
```

第一版只实现：

```text
Generic HTML Importer
```

不要第一时间实现大量学校适配。

学校适配以后按照 Plugin / Importer architecture 加入。

---

# 45. Backup

备份使用完整 JSON。

格式：

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

必须包含 schema version。

---

# 46. Restore

恢复之前：

```text
验证文件版本
↓
验证数据结构
↓
检查引用关系
↓
显示预览
↓
用户确认
↓
事务写入
```

失败必须回滚。

---

# 47. CSV Export

至少支持：

```text
当前课表
全部课表
```

推荐默认：

```text
当前课表
```

字段：

```text
课程名称
星期
开始节
结束节
老师
地点
周数
```

---

# 48. ICS Export

导出课程发生时间。

必须包含：

```text
DTSTART
DTEND
SUMMARY
LOCATION
DESCRIPTION
```

明确：

```text
❌ 不生成 VALARM
```

---

# 49. 自动备份

推荐实现：

```text
每天首次启动时
→ 检查上次备份时间
→ 自动创建备份
```

默认：

```text
关闭
```

用户开启后：

```text
保留最近 10 个备份
```

---

# 50. App Settings

全局设置只保存真正的全局配置：

```text
theme
language
activeScheduleId
autoBackup
startupBehavior
```

不存在：

```text
课程颜色
课表周数
课表时间
课表透明度
```

这些属于 Schedule。

---

# 51. Router

最终：

```text
/
    ScheduleView

/schedules
    ScheduleManagerView

/schedule/:id/settings
    ScheduleSettingsView

/course/new
    CourseEditorView

/course/:id/edit
    CourseEditorView

/import
    ImportView

/export
    ExportView

/settings
    GlobalSettingsView
```

课程详情不使用 route。

使用：

```text
NDrawer
```

---

# 52. Pinia Store

## scheduleStore

负责：

```ts
schedules
activeScheduleId
activeSchedule
loadSchedules()
switchSchedule()
createSchedule()
deleteSchedule()
updateSchedule()
```

---

## courseStore

负责：

```text
当前课表课程
加载
新增
编辑
删除
刷新
```

---

## settingsStore

负责：

```text
global settings
schedule style
theme
language
```

---

## uiStore

负责：

```text
drawer
modal
current week
import dialog
export dialog
```

---

# 53. State 原则

不要让同一个数据存在多个事实来源。

错误：

```text
CourseCard 自己复制一份课程
Store 又有一份
ScheduleGrid 又有一份
```

正确：

```text
SQLite
 ↓
Repository
 ↓
Pinia
 ↓
Engine
 ↓
UI
```

---

# 54. 主课表性能原则

不要每次鼠标移动都：

```text
SELECT * FROM course
```

课程应该：

```text
加载一次
↓
Pinia cache
↓
Engine 计算
```

切周：

```text
不要重新查询 SQLite
```

除非：

```text
课程发生修改
课表发生修改
设置发生修改
```

---

# 55. 必须实现的空状态

第一次打开：

```text
还没有课表

创建一个课表
或者
导入课表
```

不要出现：

```text
空白白屏
```

使用：

```text
NEmpty
NButton
```

---

# 56. 错误处理

数据库错误：

```text
NNotification
```

导入错误：

```text
NAlert
+
ImportErrorList
```

不可恢复错误：

```text
Error Boundary
```

不得出现：

```text
Uncaught Promise
```

直接让页面崩掉。

---

# 57. 日志

开发阶段允许：

```ts
console.debug()
console.warn()
console.error()
```

正式版本需要统一 Logger：

```ts
logger.debug()
logger.info()
logger.warn()
logger.error()
```

禁止到处散落复杂日志。

---

# 58. 测试

必须有：

```text
engine unit tests
repository tests
importer tests
```

重点测试：

```text
单双周
双周
连续周
间断周
跨月
跨年
课程冲突
自定义时间
调课
删除级联
```

---

# 59. Vibe Coding 阶段

# Phase 0：项目骨架

目标：

```text
Vue
+
Vite
+
TS
+
Naive UI
+
Pinia
+
Router
+
Tauri
+
SQLite
```

实现：

```text
App.vue
Router
Naive UI Provider
SQLite connection
Migration
基础 layout
```

### 验收标准

```text
[ ] npm run build 成功
[ ] Tauri dev 成功
[ ] SQLite 成功创建
[ ] migration 执行成功
[ ] 重启应用数据库仍存在
[ ] Naive UI provider 正常
```

---

# Phase 1：Schedule Core

实现：

```text
Schedule
Course
CourseSession
```

完成：

```text
创建课表
新增课程
编辑课程
删除课程
查看课程
切换周
```

### 验收标准

```text
[ ] 可以创建课表
[ ] 可以创建课程
[ ] 可以删除课程
[ ] 一个课程可以有多个时间段
[ ] 重启后数据存在
[ ] 切换周正确
[ ] 当前星期有视觉标记
```

---

# Phase 2：Schedule Engine

实现：

```text
WeekRuleEngine
DateEngine
ConflictEngine
PositionEngine
ScheduleEngine
```

### 验收标准

必须通过：

```text
[ ] 1-16周
[ ] 1-8单周
[ ] 2-16双周
[ ] 1-5、7-11
[ ] 多时间段
[ ] 课程冲突
[ ] 跨月
[ ] 跨年
[ ] 自定义时间
```

这一阶段完成之前：

> 禁止继续大量开发 UI。

---

# Phase 3：多课表

实现：

```text
ScheduleSwitcher
ScheduleManager
ScheduleCreateDialog
```

### 验收标准

```text
[ ] 创建多个课表
[ ] 每个课表数据隔离
[ ] 每个课表有自己的外观
[ ] 每个课表有自己的时间表
[ ] 删除课表不会影响其他课表
```

---

# Phase 4：Appearance

实现：

```text
ScheduleAppearanceForm
```

支持：

```text
背景
课程颜色
透明度
圆角
网格
显示地点
显示老师
显示时间
显示非本周课程
```

### 验收标准

```text
[ ] 设置即时预览
[ ] 重启后保留
[ ] 切换课表互不影响
[ ] 深色/浅色 UI 正常
```

---

# Phase 5：CSV Import / Export

实现：

```text
CsvImporter
csvExporter
ImportPreview
ImportErrorList
```

### 验收标准

```text
[ ] CSV 可以导入
[ ] 导入前有预览
[ ] 错误不会直接写入 DB
[ ] 用户确认后才提交
[ ] CSV 可以导出
[ ] 导出后重新导入数据一致
```

---

# Phase 6：Backup / Restore / ICS

实现：

```text
backupExporter
backupImporter
icsExporter
backupService
```

### 验收标准

```text
[ ] 完整备份
[ ] 完整恢复
[ ] 恢复失败自动回滚
[ ] 版本字段存在
[ ] ICS 正常
[ ] ICS 不生成 VALARM
```

---

# Phase 7：调课

实现：

```text
CourseOverride
OverrideEditor
```

### 验收标准

测试：

```text
周一数学
→ 调到周三

只影响指定日期

下一周数学仍保持原安排
```

必须通过。

---

# Phase 8：HTML Import

实现：

```text
HtmlImporter
ImporterRegistry
ImporterSelector
```

先支持：

```text
Generic HTML
```

再考虑：

```text
ZhengFang
QiangZhi
URP
其他教务系统
```

---

# Phase 9：自动备份

实现：

```text
BackupScheduler
BackupManager
```

### 验收标准

```text
[ ] 开启后自动生成
[ ] 最多保留 10 个
[ ] 删除旧备份
[ ] 用户可手动备份
[ ] 用户可以恢复
```

---

# Phase 10：高级功能

后置：

```text
拖拽导入
复制课表
高级调课
桌面悬浮窗口
系统托盘
在线分享
学校 Importer
```

---

# 60. Vibe Coding 总 Prompt

将下面内容直接交给 Coding Agent：

---

你现在是一名资深桌面应用工程师，负责开发一个：

**Vue 3 + TypeScript + Naive UI + Tauri + SQLite 的 WakeUp 风格课程表桌面应用。**

目标不是开发闹钟软件。

禁止实现：

```text
闹钟
上课提醒
通知
后台提醒
倒计时
铃声
```

核心目标是：

> 复刻 WakeUp 课程表的核心数据模型、课表展示方式、周数逻辑、多课表、课程编辑、冲突课程、导入导出、课表外观和调课能力。

---

## 技术约束

必须使用：

```text
Vue 3
Vite
TypeScript
Pinia
Vue Router
Naive UI
SCSS
Tauri 2
@tauri-apps/plugin-sql
SQLite
```

禁止：

```text
React
Electron
Ant Design Vue
Element Plus
其他 UI Framework
```

---

## UI Framework 规则

Naive UI 是默认 UI Framework。

所有：

```text
Form
Modal
Dialog
Drawer
Dropdown
Select
Input
InputNumber
DatePicker
ColorPicker
Switch
Slider
Tabs
Table
Alert
Notification
Empty
Loading
```

优先使用 Naive UI。

但主课表禁止使用：

```text
NDataTable
HTML table
```

主课表必须自行使用：

```text
CSS Grid
absolute positioning
Vue components
```

---

## Architecture

严格遵循：

```text
View
↓
Component
↓
Pinia Store
↓
Repository
↓
SQLite
```

课表渲染：

```text
Pinia
↓
ScheduleEngine
↓
RenderedCourse
↓
ScheduleGrid
```

Importer：

```text
File/Input
↓
Importer
↓
ImportedSchedule
↓
Validation
↓
Preview
↓
Commit
↓
SQLite
```

---

## 绝对禁止

禁止把：

```text
单双周逻辑
日期计算
课程冲突判断
课程位置计算
```

写进：

```text
Vue Template
Vue Component
CSS
```

这些必须全部属于：

```text
src/engine/
```

---

## 开发顺序

严格按照：

```text
Phase 0
项目基础设施

↓
Phase 1
Schedule Core

↓
Phase 2
Schedule Engine

↓
Phase 3
多课表

↓
Phase 4
外观

↓
Phase 5
CSV

↓
Phase 6
Backup + ICS

↓
Phase 7
调课

↓
Phase 8
HTML Import

↓
Phase 9
自动备份

↓
Phase 10
高级功能
```

禁止跨阶段大量开发。

---

## 每个 Phase 的工作方式

在开始任何 Phase 时：

1. 先阅读当前代码。
2. 检查现有目录。
3. 检查数据库 migration。
4. 检查是否已经实现相关模型。
5. 不重复创建已有模块。
6. 先实现领域逻辑。
7. 再实现 Repository。
8. 再实现 Store。
9. 最后实现 UI。
10. 自动补充测试。

---

## 修改原则

不要为了实现新功能重写整个项目。

优先：

```text
small patch
```

而不是：

```text
rewrite architecture
```

任何重大架构修改必须说明原因。

---

## Database Rules

所有数据库变化：

```text
必须通过 migration
```

禁止直接修改旧 migration。

创建新版本：

```text
0005_xxx.sql
```

所有删除关系必须考虑：

```text
FOREIGN KEY
ON DELETE CASCADE
```

数据库开启：

```sql
PRAGMA foreign_keys = ON;
```

---

## Data Rules

Course 不保存：

```text
weekday
section
teacher
location
```

这些属于：

```text
CourseSession
```

一门课程必须允许拥有多个 CourseSession。

周数必须结构化保存。

禁止依赖：

```text
"1-5、7-11单"
```

作为数据库内部核心数据。

---

## UI Rules

主页面必须：

```text
启动后直接进入课表
```

不能出现：

```text
登录页
首页 Dashboard
欢迎页
```

第一次启动除外。

第一次启动：

```text
创建课表
/
导入课表
```

---

## UX Rules

所有危险操作：

```text
NDialog
```

所有状态提示：

```text
NMessage
NNotification
NAlert
```

所有表单：

```text
NForm
```

课程详情：

```text
NDrawer
```

设置页：

```text
NTabs
```

---

## Testing Rules

至少为以下逻辑写测试：

```text
WeekRuleEngine
DateEngine
ConflictEngine
PositionEngine
CSV Importer
Backup Importer
```

重点测试：

```text
连续周
单双周
自定义周
跨月
跨年
多时间段
冲突
调课
```

---

## Completion Rule

每完成一个 Phase：

必须输出：

```text
1. 修改了哪些文件
2. 新增了哪些功能
3. 数据库是否变化
4. 新增了哪些测试
5. 当前验收结果
6. 已知问题
7. 下一阶段建议
```

没有通过当前 Phase 的验收标准：

> 不得自行进入下一阶段。

---

# 61. Definition of Done

一个功能只有同时满足：

```text
代码完成
+
UI 完成
+
数据持久化完成
+
错误处理完成
+
测试完成
+
重启验证完成
```

才能宣布完成。

---

# 62. MVP Definition of Done

当以下全部通过：

```text
[✓] 创建课表
[✓] 删除课表
[✓] 多课表
[✓] 新增课程
[✓] 编辑课程
[✓] 删除课程
[✓] 多时间段
[✓] 连续周
[✓] 单双周
[✓] 非连续周
[✓] 切周
[✓] 当前周
[✓] 冲突课程
[✓] 自定义时间
[✓] 时间表
[✓] 课表外观
[✓] CSV 导入
[✓] CSV 导出
[✓] JSON 备份
[✓] JSON 恢复
[✓] ICS 导出
```

才认为：

> **WakeUp Desktop Core MVP 完成。**

---

# 63. 最终产品结构

最终用户打开应用：

```text
┌──────────────────────────────────────────┐
│ 我的大学课表   第 6 周      ＋  导入 ⋯ │
├────────┬─────────────────────────────────┤
│        │ 周一 周二 周三 周四 周五 周六 日 │
├────────┼─────────────────────────────────┤
│ 08:00  │ 数学      英语                  │
│        │ 数学      英语                  │
├────────┼─────────────────────────────────┤
│ 10:00  │      数据库                     │
│        │      数据库                     │
├────────┼─────────────────────────────────┤
│ 14:00  │ 软件工程                        │
│        │ 软件工程                        │
└────────┴─────────────────────────────────┘
```

用户不需要理解任何数据库概念。

所有复杂的数据模型：

```text
WeekRule
CourseSession
CourseOverride
ScheduleStyle
TimeTable
Conflict
```

全部隐藏在系统内部。

用户只需要：

```text
看到课
点击课
编辑课
切周
切课表
导入
导出
```

---

# 64. 最重要的工程原则

> **不要为了看起来像 WakeUp 而复制 WakeUp 的代码结构；要复制它的产品语义。**

真正需要高度还原的是：

```text
课表模型
+
周数
+
时间段
+
冲突
+
多课表
+
外观
+
导入导出
```

而不是：

```text
页面数量
+
按钮数量
+
移动端功能
```

最终产品应该成为一个：

> **本地优先、桌面原生体验、无提醒负担、数据结构严谨、支持复杂课表规则的 WakeUp 风格课程表。**