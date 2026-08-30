-- 0001_initial.sql —— 基础表：schedule / course / course_session / timetable / timetable_section
-- 权威来源：docs/数据库设计.sql 第一段；索引归入本迁移。
-- 幂等约定见 docs/DATABASE.md §5（CREATE ... IF NOT EXISTS）。

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
    FOREIGN KEY(schedule_id) REFERENCES schedule(id) ON DELETE CASCADE
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
    FOREIGN KEY(course_id) REFERENCES course(id) ON DELETE CASCADE
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
    FOREIGN KEY(timetable_id) REFERENCES timetable(id) ON DELETE CASCADE
);

-- 高频查询路径索引（docs/数据库设计.sql 索引段）
CREATE INDEX IF NOT EXISTS idx_course_schedule_id ON course(schedule_id);
CREATE INDEX IF NOT EXISTS idx_course_session_course_id ON course_session(course_id);
CREATE INDEX IF NOT EXISTS idx_course_session_weekday ON course_session(weekday);
CREATE INDEX IF NOT EXISTS idx_timetable_section_timetable_id ON timetable_section(timetable_id);