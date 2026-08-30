-- ============================================================================
-- ClassNest 数据库设计
-- 依据：docs/tech.md 数据模型章节（第 8-18 节 / migration 0001-0004）
--
-- 数据库：SQLite
-- 说明：本文件是可执行的完整 DDL；实际项目按 0001-0004 四段迁移依次执行。
--
-- 表关系一览：
--   schedule           课表（1 张课表）
--   course             课程（Schedule 1 ──< Course）
--   course_session     课程时间段（Course 1 ──< CourseSession）
--   timetable          时间表（Schedule N ──> TimeTable）
--   timetable_section  节次（TimeTable 1 ──< TimeSection）
--   course_override    调课记录（Schedule 1 ──< Override；Session 关联）
--   schedule_style     课表外观（Schedule 1 ── 1 Style）
--   app_setting        全局设置（key-value）
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- migration: 0001_initial.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 课表名称，如“我的大学课表”
    name TEXT NOT NULL,

    -- 学期开始日期，ISO 格式 YYYY-MM-DD
    semester_start TEXT NOT NULL,

    -- 当前所在周
    current_week INTEGER NOT NULL DEFAULT 1,

    -- 学期总周数
    total_weeks INTEGER NOT NULL DEFAULT 20,

    -- 每周第一天：1=周一 ... 7=周日（同时支持周一与周日作为第一天）
    first_day_of_week INTEGER NOT NULL DEFAULT 1,

    -- 一天课程节数（即 ScheduleGrid 纵向格数）
    section_count INTEGER NOT NULL DEFAULT 12,

    -- 关联的时间表；NULL 表示未显式选择（应使用默认时间表）
    time_table_id INTEGER,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 所属课表
    schedule_id INTEGER NOT NULL,

    -- 课程名称
    name TEXT NOT NULL,

    -- 课程颜色，如 #4C8DFF
    color TEXT NOT NULL,

    -- 学分（允许小数，如 3.5）
    credits REAL,

    -- 备注
    note TEXT,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY(schedule_id)
        REFERENCES schedule(id)
        ON DELETE CASCADE
);

-- 注意：Course 不保存星期、节次、老师、地点，
-- 这些属于 course_session。
CREATE TABLE IF NOT EXISTS course_session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 所属课程
    course_id INTEGER NOT NULL,

    -- 星期几：1=周一 ... 7=周日
    weekday INTEGER NOT NULL,

    -- 开始节次 / 结束节次（1 起）
    start_section INTEGER NOT NULL,
    end_section INTEGER NOT NULL,

    -- 自定义时间：仅 is_custom_time = 1 时必须存在
    start_time TEXT,
    end_time TEXT,

    -- 老师 / 地点
    teacher TEXT,
    location TEXT,

    -- 周数规则，JSON 字符串，例如：
    -- {"type":"custom","ranges":[{"start":1,"end":5},{"start":7,"end":11,"parity":"odd"}]}
    week_rule TEXT NOT NULL,

    -- 可选绝对日期区间（跨学期/短学期场景），ISO YYYY-MM-DD
    date_start TEXT,
    date_end TEXT,

    -- 是否使用自定义时间
    is_custom_time INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY(course_id)
        REFERENCES course(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 时间表名称，如“默认时间表”
    name TEXT NOT NULL,

    -- 是否为默认时间表；默认时间表不允许删除/重命名
    is_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS timetable_section (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 所属时间表
    timetable_id INTEGER NOT NULL,

    -- 节次序号，如 1, 2, 3 ...
    section_number INTEGER NOT NULL,

    -- 起止时间，HH:MM 24 小时制
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,

    FOREIGN KEY(timetable_id)
        REFERENCES timetable(id)
        ON DELETE CASCADE
);

-- ============================================================================
-- migration: 0002_course_override.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_override (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 所属课表（便于按课表批量查询/级联删除）
    schedule_id INTEGER NOT NULL,

    -- 被调课的时间段
    course_session_id INTEGER NOT NULL,

    -- 被调课的原始日期，ISO YYYY-MM-DD
    original_date TEXT NOT NULL,

    -- 类型：move（移动）/ cancel（取消）/ replace（替换）
    type TEXT NOT NULL,

    -- move / replace 时：目标日期
    target_date TEXT,

    -- 移动或替换后：目标节次区间（可选）
    start_section INTEGER,
    end_section INTEGER,

    -- 替换后的地点 / 老师（可选）
    location TEXT,
    teacher TEXT,

    -- 备注
    note TEXT,

    FOREIGN KEY(schedule_id)
        REFERENCES schedule(id)
        ON DELETE CASCADE,

    FOREIGN KEY(course_session_id)
        REFERENCES course_session(id)
        ON DELETE CASCADE
);

-- ============================================================================
-- migration: 0003_schedule_style.sql
-- ============================================================================

-- 外观配置属于课表，不属于全局。
CREATE TABLE IF NOT EXISTS schedule_style (
    schedule_id INTEGER PRIMARY KEY,

    -- 背景类型：color / image
    background_type TEXT NOT NULL DEFAULT 'color',

    -- 背景值：颜色值或图片路径
    background_value TEXT NOT NULL DEFAULT '#ffffff',

    -- 是否显示时间 / 地点 / 老师
    show_time INTEGER NOT NULL DEFAULT 1,
    show_location INTEGER NOT NULL DEFAULT 1,
    show_teacher INTEGER NOT NULL DEFAULT 0,

    -- 是否显示网格辅助线
    show_grid INTEGER NOT NULL DEFAULT 1,

    -- 是否显示非本周课程（含透明度）
    show_non_current_week INTEGER NOT NULL DEFAULT 1,
    non_current_week_opacity REAL NOT NULL DEFAULT 0.35,

    -- 课程卡边框 / 圆角 / 卡高度倍率
    course_border INTEGER NOT NULL DEFAULT 0,
    course_radius REAL NOT NULL DEFAULT 8,
    course_height REAL NOT NULL DEFAULT 1,

    FOREIGN KEY(schedule_id)
        REFERENCES schedule(id)
        ON DELETE CASCADE
);

-- ============================================================================
-- migration: 0004_app_settings.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_setting (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 全局设置只保存真正的全局配置：
--   theme、language、active_schedule_id、auto_backup、startup_behavior
-- 课程颜色、课表周数、课表时间、课表透明度属于 schedule_style，
-- 不存放在 app_setting。

-- ============================================================================
-- 索引设计
-- 目的：满足“按课表加载整套课程”与“按日期查询调课”的高频查询路径。
-- ============================================================================

-- 按课表加载课程
CREATE INDEX IF NOT EXISTS idx_course_schedule_id
    ON course(schedule_id);

-- 按课程加载时间段
CREATE INDEX IF NOT EXISTS idx_course_session_course_id
    ON course_session(course_id);

-- 渲染/查询常用过滤：星期
CREATE INDEX IF NOT EXISTS idx_course_session_weekday
    ON course_session(weekday);

-- 按课表查询调课记录
CREATE INDEX IF NOT EXISTS idx_course_override_schedule_id
    ON course_override(schedule_id);

-- 按时间段查询调课记录
CREATE INDEX IF NOT EXISTS idx_course_override_course_session_id
    ON course_override(course_session_id);

-- 按原始日期查询当天调课（渲染指定日期课程）
CREATE INDEX IF NOT EXISTS idx_course_override_original_date
    ON course_override(original_date);

-- 按时间表加载节次
CREATE INDEX IF NOT EXISTS idx_timetable_section_timetable_id
    ON timetable_section(timetable_id);

-- ============================================================================
-- 约定说明（业务层实现，不在此文件中实现为触发器）：
--   1. 新建课表时必须同时创建：schedule + 默认 timetable + 默认 schedule_style；
--   2. 删除课表时依赖 ON DELETE CASCADE，级联删除课程、时间段、调课与外观；
--   3. week_rule 必须是结构化 JSON，禁止把 "1-5、7-11单" 字符串作为核心数据；
--   4. 所有数据库变更必须通过新增 migration（0005_xxx.sql），禁止修改旧迁移。
-- ============================================================================
