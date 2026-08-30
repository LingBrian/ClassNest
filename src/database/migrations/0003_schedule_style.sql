-- 0003_schedule_style.sql —— 课表外观（属于课表，不属于全局配置）
-- 权威来源：docs/数据库设计.sql 第三段。schedule_id 同时为主键与外键（1:1）。

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
    FOREIGN KEY(schedule_id) REFERENCES schedule(id) ON DELETE CASCADE
);