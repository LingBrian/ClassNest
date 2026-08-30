-- 0002_course_override.sql —— 调课记录（Phase 7 复用本表，不再新增表）
-- 权威来源：docs/数据库设计.sql 第二段。
-- type 取值：move / cancel / replace；只影响 original_date 对应日期，不修改原课程。

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
    FOREIGN KEY(schedule_id) REFERENCES schedule(id) ON DELETE CASCADE,
    FOREIGN KEY(course_session_id) REFERENCES course_session(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_override_schedule_id ON course_override(schedule_id);
CREATE INDEX IF NOT EXISTS idx_course_override_course_session_id ON course_override(course_session_id);
CREATE INDEX IF NOT EXISTS idx_course_override_original_date ON course_override(original_date);