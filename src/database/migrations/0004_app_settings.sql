-- 0004_app_settings.sql —— 全局键值设置
-- 权威来源：docs/数据库设计.sql 第四段。
-- 只允许真正的全局键（键名 snake_case）：theme / language / active_schedule_id / auto_backup / startup_behavior。
-- 课程颜色、课表周数、时间、透明度属于 schedule_style，禁止写入本表。

CREATE TABLE IF NOT EXISTS app_setting (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);