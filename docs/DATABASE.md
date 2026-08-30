# DATABASE.md — ClassNest 数据库规范

> 权威来源：`docs/tech.md`（§15-18）与 `docs/数据库设计.sql`（完整 DDL，本文件是约束摘要）。
> 数据库：SQLite，访问方式 `@tauri-apps/plugin-sql`，由前端 Repository 独占访问，Rust 侧不写 DB CRUD。
> 当前仓库尚无实代码，migration 文件是「规划中的落地目标」，任何 Agent 不得把未落地的表当作已存在事实。

## 1. 总则

- 所有数据库变化必须通过**新增 migration**（`0005_xxx.sql` 起），禁止修改已交付/已应用的旧 migration。
- 连接建立后立即执行 `PRAGMA foreign_keys = ON;`（见 migration 0001 开头）。
- 表/字段一律 snake_case。
- 日期 `YYYY-MM-DD`，时间 `HH:MM`（24 小时制）。
- `week_rule` 是 JSON 字符串；禁止把 `"1-5、7-11单"` 这类字符串作为核心数据存储。
- Repository 是唯一 DB 访问口；View/Component 禁止 `db.select/execute`。

## 2. 表清单

| 表 | 说明 | 关键关系 |
| --- | --- | --- |
| `schedule` | 课表 | `1 ──< course`、`1 ──1 schedule_style`、外接 `timetable`（`time_table_id` 可空，空=用默认时间表） |
| `course` | 课程 | `schedule_id` → schedule，`1 ──< course_session` |
| `course_session` | 课程时间段 | `course_id` → course；保存 weekday/节次/老师/地点/周规则/自定义时间 |
| `timetable` | 时间表 | `1 ──< timetable_section`；`is_default` 的时间表不可删除/重命名 |
| `timetable_section` | 节次 | `timetable_id` → timetable |
| `course_override` | 调课 | `schedule_id` → schedule、`course_session_id` → course_session |
| `schedule_style` | 课表外观 | `schedule_id` 主键 + 外键 → schedule（1:1） |
| `app_setting` | 全局键值 | `key TEXT PRIMARY KEY`，`value TEXT NOT NULL` |

所有外键关系均带 `ON DELETE CASCADE`（schedule → course → course_session；timetable → timetable_section；schedule_style / course_override 直挂 schedule）。

## 3. 各表要点（默认值）

- `schedule`：`current_week` 默认 1、`total_weeks` 默认 20、`first_day_of_week` 默认 1（1=周一…7=周日）、`section_count` 默认 12、`time_table_id` 可空。
- `course`：`color` 非空（hex）；`credits REAL`、`note TEXT` 可空；**不保存**星期/节次/老师/地点。
- `course_session`：`weekday` 1=周一…7=周日；`start_section` / `end_section` 从 1 起；`week_rule TEXT NOT NULL`；`is_custom_time INTEGER 默认 0`，自定义时间时 `start_time`/`end_time` 必填；`date_start`/`date_end` 可空（绝对日期区间）。
- `timetable`：`is_default INTEGER 默认 0`，默认时间表禁止删除/重命名。
- `course_override`：`type TEXT NOT NULL`，取值 `move` / `cancel` / `replace`；`original_date` 必填；`target_date`/`start_section`/`end_section`/`location`/`teacher`/`note` 可空。
- `schedule_style`：`background_type` 默认 `color`、`background_value` 默认 `#ffffff`；`show_*` 默认 1（`show_teacher` 默认 0）；`non_current_week_opacity` 默认 0.35；`course_radius` 默认 8；`course_height` 默认 1。
- `app_setting`：只允许真正的全局键：`theme` / `language` / `active_schedule_id` / `auto_backup` / `startup_behavior` 等；课程颜色/周数/时间/透明度等属于 `schedule_style`，禁止放入 `app_setting`。

## 4. 索引清单（见 docs/数据库设计.sql）

```text
idx_course_schedule_id                     course(schedule_id)
idx_course_session_course_id               course_session(course_id)
idx_course_session_weekday                 course_session(weekday)
idx_course_override_schedule_id            course_override(schedule_id)
idx_course_override_course_session_id      course_override(course_session_id)
idx_course_override_original_date          course_override(original_date)
idx_timetable_section_timetable_id         timetable_section(timetable_id)
```

目的：支撑「按课表加载整套课程」「按课程加载时间段」「按日期查调课」三条高频查询路径。

## 5. 迁移管理

- migration 文件位于 `src/database/migrations/`：`0001_initial.sql`、`0002_course_override.sql`、`0003_schedule_style.sql`、`0004_app_settings.sql`。
- 后续任何结构变化一律 `0005_xxx.sql` 起，按「应用版本追踪」执行（执行/记账机制为 NEEDS_DECISION，见 DECISIONS.md）。
- 新 migration 编写规范：
  - 命名 `000N_<snake_case描述>.sql`，编号顺延，不跳过、不重号；
  - 尽量幂等（`CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`）；
  - 一条 migration 只做一类变更（建表、加列、加索引分开），便于定位与回滚分析；
  - 新增表涉及外键时，确认级联策略（`ON DELETE CASCADE`）并补充对应索引；
  - 新增索引也走 migration，不得散落在 Repository 内联 SQL 里；
  - migration 与 `docs/API.md` 模型、`docs/DATABASE.md` 同步更新；
  - 落地后为 migration 幂等性补测试（Phase 0 验收含此项）。
- 恢复备份：版本验证 → 结构验证 → 引用检查 → 预览 → 确认 → 事务写入，失败整体回滚。
- 禁止在 migration 之外用 `CREATE TABLE` 补结构、禁止绕过 Repository 直改数据。

## 6. 数据完整性约定（业务层实现）

1. 新建课表同一流程创建：`schedule + 默认 timetable + 默认 schedule_style`。
2. 删除课表依赖 `ON DELETE CASCADE` 级联删除课程、时间段、调课记录与外观，须在 NDialog 中明确提示。
3. `week_rule` 必须合法 JSON（结构：`type` ∈ range/odd/even/custom，`ranges` 为 `{start,end,parity?}` 数组）；写入前校验，非法输入由 UI 预览阶段拦截，不直写 DB。
4. 默认 timetable 不可删除/不可重命名。

## 7. 禁止事项

- 禁止修改已交付的旧 migration（0001-0004 一旦应用即成历史）。
- 禁止绕过 Repository 直连 SQLite。
- 禁止把课程外观/周数/时间放进 `app_setting`。
- 禁止把 `week_rule` 存成非 JSON 的核心字符串形式。
- 禁止在 migration 中使用中文表名或非 snake_case 命名。